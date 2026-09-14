# Melina's Bakery: Complete Feature Flow

This document explains how the main features move through the application, from
the React frontend to the Express backend, database, external services, and
back to the user interface.

## 1. System Overview

The project is a full-stack restaurant and bakery management system.

```text
Customer or staff browser
        |
        | React pages, forms, Axios requests, Socket.IO client
        v
Frontend (Vite + React + TypeScript)
        |
        | HTTP API and WebSocket connection
        v
Backend (Node.js + Express + Socket.IO)
        |
        +--> MongoDB: users, menu, tables, orders, members, settings
        +--> Redis/BullMQ: email, SMS, and WhatsApp jobs
        +--> Cloudinary: uploaded images
        +--> eSewa: online payment
        +--> SMTP/Sparrow/WhatsApp: notifications
```

Main source locations:

- Frontend routes: `Frontend/src/main.tsx`
- Frontend API configuration: `Frontend/src/constants/constants.tsx`
- Backend entry point: `Backend/index.js`
- Backend router registration: `Backend/src/config/router.config.js`
- Authentication middleware: `Backend/src/middleware/auth.middelware.js`
- Request validation: `Backend/src/middleware/request.validator.js`
- Database connection: `Backend/src/config/db.config.js`

## 2. Application Startup Flow

1. The frontend Vite server starts on port `5173`.
2. The backend loads environment variables from `Backend/.env`.
3. The backend connects to MongoDB.
4. Startup cleanup archives orders belonging to released tables.
5. The backend starts the HTTP and Socket.IO server on port `9005`.
6. Express mounts all feature routers under `/api`.
7. Background BullMQ workers start for email, SMS, and WhatsApp jobs.

The backend waits for MongoDB before accepting HTTP requests. This prevents the
first login or menu request from running while Mongoose is still connecting.

## 3. Frontend Navigation and URL Protection

The frontend uses React Router. Public pages include:

- Home
- Login
- Registration
- Menu
- Checkout
- Order tracking
- Membership
- Contact Us
- About Us
- Payment result pages

Protected pages are wrapped by `ProtectedRoute`:

- Profile
- Settings
- Dashboard
- Table Management
- Staff Management
- Analytics
- Billing Settings
- Reception Billing

`ProtectedRoute` checks:

1. An access token exists in `localStorage`.
2. A stored user profile exists.
3. The user's role is allowed for that page.

Unknown URLs use the catch-all route and render the Error page.

The frontend check is for user experience only. Backend authorization is the
real security boundary.

## 4. Authentication and Authorization Flow

### Login

1. The user enters an email, password, and Cloudflare Turnstile response.
2. `LoginPage` sends `POST /api/auth/login`.
3. The backend validates the request with Joi.
4. The backend finds the user in MongoDB.
5. `bcryptjs` compares the submitted password with the stored hash.
6. The backend checks whether the account is activated.
7. The backend creates:
   - An access JWT
   - A refresh JWT
8. The frontend stores the tokens and public user profile in `localStorage`.
9. The user is redirected to the home page.

### Protected request

1. The frontend reads `qr_accessToken`.
2. It sends:

   ```text
   Authorization: Bearer <access-token>
   ```

3. `allowUser()` verifies the JWT signature and token type.
4. The backend loads the user from MongoDB.
5. The middleware checks the user's role.
6. The request continues to the controller, or returns `401`/`403`.

Configured staff roles include Admin, Chef, Waiter, and Reception. Admin has
access to all role-restricted staff resources.

## 5. Registration and Account Activation

1. The user submits the registration form.
2. The frontend uploads the optional profile image as multipart form data.
3. Multer receives the file.
4. Cloudinary stores the image.
5. The backend validates the registration fields.
6. The password is hashed with bcrypt.
7. A user record is created with an activation token.
8. An activation email job is added to BullMQ.
9. The email worker builds the activation email and sends it through SMTP.
10. The user opens the activation link.
11. The backend clears the activation token and activates the account.
12. The user can log in.

If registration fails after an image upload, the backend removes the uploaded
Cloudinary file to avoid unused media.

## 6. Menu Browsing and Menu Management

### Customer menu

1. The customer opens the Menu page.
2. The frontend calls `GET /api/menu/list`.
3. The backend reads bakery items from MongoDB.
4. Items are grouped and displayed by category.
5. The customer can inspect item details, add-ons, stock, and availability.

### Admin menu management

1. An Admin opens the Add Menu page.
2. The frontend submits item data and up to four images.
3. Backend authorization verifies the Admin role.
4. Joi validates the item data.
5. Multer receives the images.
6. Cloudinary stores the images.
7. The bakery item is saved in MongoDB.
8. Admins can delete items through the protected delete endpoint.

## 7. QR Table Ordering Flow

1. Staff creates a table from Table Management.
2. The frontend generates a QR code containing a table menu URL.
3. A customer scans the QR code with a phone.
4. The browser opens `/MenuPage/:tableNumber`.
5. The header obtains a browser session ID.
6. The frontend calls `PUT /api/table/:tableNumber/occupy`.
7. The backend checks whether the table is available.
8. If available, the backend stores the session ID as `occupiedBy`.
9. The table number is stored locally and attached to the order.
10. If the table is already occupied, the customer sees a message and a list of
    currently available tables.
11. Selecting another table opens that table's menu and attempts to occupy it.

The public available-table endpoint returns only table numbers whose status is
`Available`; it does not expose staff billing information.

## 8. Cart, Checkout, and Order Creation

1. The customer adds menu items to the cart.
2. Cart data is stored in browser local storage.
3. The checkout page displays items, quantities, add-ons, notes, discount, and
   membership information.
4. The frontend requests a billing preview from the backend.
5. The backend applies configured tax, service charge, packaging charge, and
   membership discount rules.
6. The customer chooses:
   - Pay at the counter
   - Pay online with eSewa
7. The frontend sends `POST /api/order/`.
8. The backend validates the order and saves it in MongoDB.
9. The backend emits `kitchen_new_order` through Socket.IO.
10. The kitchen dashboard receives the new order without a manual refresh.

## 9. Online eSewa Payment Flow

1. The customer selects Pay Now.
2. The order is created first, producing an order ID.
3. The frontend calls `POST /api/payment/esewa/qr`.
4. The backend verifies the order and marks its payment as pending.
5. The backend creates a QR code pointing to `/payment/pay/:orderId`.
6. The customer scans the QR code.
7. `PaymentPayPage` loads the order and requests a signature from
   `POST /api/payment/esewa/init`.
8. The backend creates an HMAC-SHA256 signature using:

   ```text
   total_amount,transaction_uuid,product_code
   ```

9. The frontend submits an HTML form to the eSewa sandbox payment URL.
10. eSewa redirects to the backend success or failure callback.
11. The backend verifies the returned signature and payment status.
12. The order is marked Paid or Failed.
13. The backend refreshes the table billing status.
14. The frontend polls the order status and redirects the customer to tracking
    after successful payment.

Sandbox testing uses the eSewa credentials supplied by eSewa. Payment secrets
must remain in `Backend/.env` and must never be committed.

## 10. Order Tracking and Kitchen Dashboard

### Customer tracking

1. The customer opens `/OrderTracking/:orderId`.
2. The frontend requests the current order status.
3. Socket.IO listens for order status updates.
4. The page displays the current state:

   ```text
   Pending -> Preparing -> Ready -> Completed
   ```

### Staff dashboard

1. An authorized staff member opens Dashboard.
2. The frontend requests `GET /api/order/kitchen`.
3. The backend returns active kitchen orders.
4. The dashboard joins the `kitchen` Socket.IO room.
5. New orders appear through `kitchen_new_order`.
6. Staff changes status through the protected status endpoint.
7. The backend updates MongoDB and emits `order_status_updated`.
8. All connected dashboards update their displayed order state.

Staff can also update order items, cancel orders, or delete completed orders
through protected backend routes.

## 11. Table Management and Reception Billing

### Table Management

1. Admin, Waiter, or Reception opens Table Management.
2. The frontend sends the access token when loading tables.
3. The backend returns table status and billing summary.
4. Admin can create, edit, and delete tables.
5. Staff can view tables, settle bills, and mark tables available according to
   their role.
6. Table changes emit `table_billing_updated` through Socket.IO.

### Billing

1. Reception, Waiter, or Admin opens Reception Billing.
2. The frontend requests the payment overview.
3. The backend groups active orders by table.
4. The backend calculates:
   - Total outstanding amount
   - Paid amount today
   - Occupied tables
   - Paid and unpaid tables
5. Staff selects a table and settles its unpaid orders.
6. Orders are marked paid using counter payment.
7. Membership payment history is updated when applicable.
8. The table can be released after its outstanding balance reaches zero.

## 12. Membership and Loyalty Flow

1. A customer submits a phone number or email for membership.
2. The backend validates the request.
3. A one-time password is generated and stored with an expiry.
4. Notification jobs are sent to Redis/BullMQ.
5. WhatsApp is attempted first when configured.
6. If WhatsApp is unavailable, the worker queues an SMS fallback.
7. Email can also be used for membership OTP delivery.
8. The customer submits the OTP.
9. The backend verifies the OTP and expiry.
10. The member profile is created or updated.
11. During checkout, the member can receive a loyalty discount.
12. Paid orders record payment history for the member.

Staff membership management is protected by role-based middleware.

## 13. Staff Management

1. An Admin opens Staff Management.
2. The frontend requests the staff list with a JWT.
3. The backend verifies Admin access.
4. Admin can create a staff account with role and optional image.
5. The backend stores the account and sends an activation email job.
6. Admin can update staff details or delete staff accounts.
7. An Admin cannot delete their own account.

## 14. Analytics

1. An Admin opens Analytics.
2. The frontend calls the protected analytics endpoints.
3. The backend queries order data from MongoDB.
4. It calculates:
   - Sales overview
   - Sales trend
   - Top-selling menu items
5. The frontend displays the results as dashboard cards and charts.

## 15. Profile and Settings

### Profile

1. An authenticated user opens Profile.
2. The frontend loads the stored profile.
3. Profile updates are sent with the access token.
4. Profile images are uploaded through Multer to Cloudinary.
5. The updated public profile is returned and stored locally.

### Billing settings

1. Admin opens Billing Settings.
2. The backend returns current tax, service, and packaging settings.
3. Admin updates the settings through the protected endpoint.
4. Checkout and preview calculations use the updated settings.

## 16. Realtime Communication

The backend creates a Socket.IO server together with the HTTP server.

Important events:

| Event | Purpose |
| --- | --- |
| `kitchen_new_order` | Sends a new order to the kitchen dashboard |
| `order_status_updated` | Updates customer and staff order status |
| `order_items_updated` | Synchronizes edited order items |
| `table_billing_updated` | Refreshes table occupancy and billing views |
| `join-room` | Allows a client to join a logical room |

Socket.IO reduces the need for manual page refreshes while staff and customers
are using the system.

## 17. Validation, Errors, and Uploads

- Joi validates structured request bodies.
- Multer handles multipart image uploads.
- The centralized Express error handler converts errors into JSON responses.
- JWT failures return `401`.
- Role failures return `403`.
- Missing resources return `404`.
- Invalid request data returns a validation error.
- Upload and request timeout failures trigger cleanup where applicable.

Typical response shape:

```json
{
  "data": null,
  "message": "Description of the result",
  "status": "RESULT_STATUS",
  "option": null
}
```

## 18. One Complete Example: Customer Places a Paid Order

```text
Scan table QR
  -> Open /MenuPage/4
  -> Occupy table 4 with browser session ID
  -> Load menu items
  -> Add bakery items to local cart
  -> Open checkout
  -> Request bill preview
  -> Create order in MongoDB
  -> Notify kitchen through Socket.IO
  -> Generate payment QR
  -> Scan payment QR
  -> Create eSewa signature
  -> Submit sandbox payment form
  -> eSewa calls backend success callback
  -> Verify HMAC signature
  -> Mark order Paid
  -> Refresh table billing
  -> Notify frontend
  -> Open order tracking
```

## 19. How to Explain the Project in a Presentation

The project follows a three-layer flow:

1. **Frontend layer**: React pages collect input, display data, store temporary
   browser state, and call APIs.
2. **Backend layer**: Express routes authenticate requests, validate data,
   execute business logic, and communicate with external services.
3. **Data and service layer**: MongoDB stores application data, Redis processes
   background jobs, Socket.IO handles realtime updates, and external providers
   handle images, messages, and payments.

The most important design idea is that the frontend is responsible for the
user experience, while the backend independently validates authentication,
authorization, request data, and business rules.

---

# Detailed Code-Level Walkthrough

This section explains the execution order in more detail. It is written so the
flow can be presented to a teacher while still matching the source code.

## 20. How a Browser Request Reaches the Backend

Every normal frontend request follows this sequence:

```text
User action
  -> React event handler
  -> API_ENDPOINTS constant
  -> Axios request
  -> laptop IP and port 9005
  -> Express middleware
  -> /api router
  -> feature router
  -> authentication middleware, if required
  -> validation middleware, if required
  -> controller
  -> service
  -> Mongoose model
  -> MongoDB
  -> controller response
  -> Axios promise resolution
  -> React state update
  -> browser re-render
```

For example, the table list request becomes:

```text
API_ENDPOINTS.LISTALLTABLE
  = http://192.168.1.64:9005/api/table/list
```

The request first reaches Express at `/api/table/list`. The `/api` prefix is
removed by `app.use("/api", router)`, and the table router receives
`/table/list`. The router then executes `allowUser(...)` before calling the
table controller. The controller asks the table service for data, and the
service reads the `Table` Mongoose model.

## 21. Frontend Bootstrap: `main.tsx`

The first frontend file is `Frontend/src/main.tsx`.

### Import phase

1. `React` is imported so JSX can be converted into React elements.
2. SweetAlert CSS is loaded globally for confirmation dialogs.
3. `main.css` is loaded globally for application-wide styles.
4. `createRoot` is imported from React DOM.
5. `BrowserRouter`, `Routes`, `Route`, and `Navigate` are imported from React
   Router.
6. Each page component is imported.
7. `ProtectedRoute` is imported as the reusable access-control wrapper.

Imports are executed before the page is rendered. This means all route
components and their dependencies must be valid before the root application can
start.

### Root rendering phase

1. `document.getElementById("root")` locates the `<div id="root">` in
   `index.html`.
2. `createRoot(...)` creates the React rendering root.
3. `React.StrictMode` enables extra development checks.
4. `BrowserRouter` reads the current browser URL and provides navigation
   context.
5. `Routes` compares the current pathname with each route.
6. The matching `Route` renders its `element`.

### Route matching

- `/` renders the home page.
- `/MenuPage` renders the general menu.
- `/MenuPage/:id` renders a menu associated with a table number.
- `/CheckoutPage` renders checkout.
- `/OrderTracking/:orderId` renders tracking for one order.
- `/payment/pay/:orderId` begins eSewa payment for one order.
- `/payment/success` and `/payment/failure` show payment results.
- `/ErrorPage` renders the reusable error page.
- `path="*"` catches any unknown URL and renders the error page.

The `:id` and `:orderId` values are route parameters. React Router extracts
them, and the page reads them with `useParams()`.

### Protected route execution

When a protected route is matched:

1. `ProtectedRoute` reads `qr_accessToken` from local storage.
2. It reads `qr_user` from local storage.
3. It parses the stored JSON profile.
4. It converts the role to lowercase and trims whitespace.
5. It compares the normalized role to the allowed role list.
6. If a token, profile, or permitted role is missing, `ErrorPage` is returned.
7. If all checks pass, `children` is rendered.

This is a navigation guard, not the final security check. A user can modify
browser storage, so every sensitive API route also uses backend middleware.

## 22. Frontend URL Resolution: `constants.tsx`

`Frontend/src/constants/constants.tsx` centralizes all network addresses.

### URL cleanup

`normalizeUrl()`:

1. Receives an optional environment value.
2. Returns an empty string when no value exists.
3. Removes surrounding whitespace.
4. Removes one trailing slash.

This prevents malformed URLs such as:

```text
http://host:9005/api//auth/login
```

### QR host override

`getUrlOverride()`:

1. Checks whether code is running in a browser.
2. Reads `host` or `publicHost` from the query string.
3. Stores a valid override in `localStorage`.
4. Reuses the stored override on later page loads.

This supports QR codes that need to tell the frontend which laptop or public
host should be used.

### Private network detection

`isLoopbackHost()` detects hosts that refer to the same device, such as
`localhost` and `127.0.0.1`.

`isPrivateIp()` accepts private IPv4 ranges:

- `10.x.x.x`
- `172.16.x.x` through `172.31.x.x`
- `192.168.x.x`

These checks are used to determine whether a phone is already visiting the
application through a LAN address.

### API constants

The file constructs endpoint strings once:

```text
API_BASE_URL
  -> /api/auth/login
  -> /api/menu/list
  -> /api/table/list
  -> /api/order
  -> /api/payment/esewa/init
```

Pages import these constants instead of manually rebuilding URLs. This reduces
typing mistakes and makes the LAN configuration central.

## 23. Backend Bootstrap: `index.js`

`Backend/index.js` creates the network server.

1. `app` is imported from the Express configuration.
2. Node's `http` module creates an HTTP server around Express.
3. Socket.IO is attached to the same HTTP server.
4. Email, SMS, and WhatsApp worker modules are imported so their workers start.
5. The Socket.IO server allows the configured HTTP methods and origins.
6. The application stores the Socket.IO instance with `app.set("io", io)`.
7. Controllers later retrieve it with `req.app.get("io")`.
8. A connection listener logs a new realtime client.
9. A `join-room` listener adds a socket to a named room.
10. A disconnect listener observes when a browser leaves.
11. `await dbReady` pauses startup until MongoDB and startup cleanup finish.
12. `httpServer.listen(..., "0.0.0.0")` binds to all network interfaces.
13. This binding is why another device on the same Wi-Fi can use the laptop IP.

The frontend Vite server follows the same LAN principle by binding to
`0.0.0.0` on port `5173`.

## 24. Express Middleware Order

`Backend/src/config/express.config.js` is important because middleware runs in
the order in which it is registered.

### CORS

The CORS middleware runs first. It allows the browser frontend to call the
backend from another origin, such as:

```text
Frontend: http://192.168.1.64:5173
Backend:  http://192.168.1.64:9005
```

### JSON body parser

`express.json()` parses JSON request bodies. For example, it turns:

```json
{"email":"user@example.com","password":"secret"}
```

into `req.body`.

### URL-encoded parser

`express.urlencoded(...)` parses traditional form submissions.

### Cookie parser

`cookieParser()` reads cookies and exposes them through `req.cookies`.

### Health route

`GET /health` returns a simple success response. It is used to determine
whether the HTTP server is alive.

### API router

`app.use("/api", router)` sends every `/api/...` request to the central router.

### Not-found middleware

If no feature router handles the request, the middleware creates a 404 error.

### Error middleware

The final middleware:

1. Logs the error server-side.
2. Starts with status code 500.
3. Uses the error's custom message and status when present.
4. Converts duplicate MongoDB keys into a validation response.
5. Converts Multer upload errors into readable file errors.
6. Uses numeric `error.code` values when they represent HTTP statuses.
7. Returns a consistent JSON error body.

## 25. Authentication: Exact Login Flow

The login flow crosses these files:

```text
LoginPage
  -> API_ENDPOINTS.LOGIN
  -> auth.router.js
  -> bodyValidator(LoginDTO)
  -> auth.controller.js/loginUser
  -> auth.service.js/getSingleUserByFilter
  -> UserModel
  -> bcrypt.compareSync
  -> jwt.sign
  -> LoginPage localStorage
```

### Frontend

1. The user types an email.
2. React stores the email in component state.
3. The user types a password.
4. React stores the password in component state.
5. Turnstile returns a CAPTCHA token.
6. The submit handler stops normal browser form submission.
7. If there is no CAPTCHA token, a toast is shown and no API call occurs.
8. `setLoading(true)` disables the login action while the request is active.
9. `fetch()` sends JSON to the login endpoint.
10. The response body is parsed with `response.json()`.
11. A non-2xx response displays the backend message.
12. A successful response is checked for account status.
13. The access token is stored as `qr_accessToken`.
14. The refresh token is stored as `qr_refreshToken`.
15. The public user object is stored as `qr_user`.
16. The browser navigates to `/`.
17. The `finally` block clears the loading state.

### Backend route

The auth router maps `POST /auth/login` to:

1. `bodyValidator(LoginDTO)`
2. `authCtr.loginUser`

The validator runs before the controller. Invalid input never reaches the
database query.

### Backend controller

`loginUser`:

1. Reads `email` and `password` from `req.body`.
2. Asks the auth service for a user by email.
3. Requests the password field because it is normally excluded from public
   profiles.
4. Returns `USER_NOT_FOUND` when no user exists.
5. Compares the submitted password with the bcrypt hash.
6. Rejects mismatched credentials.
7. Rejects accounts whose activation status is false.
8. Signs a seven-day access token containing the user ID and type `access`.
9. Signs a thirty-day refresh token containing the user ID and type `refresh`.
10. Removes private fields by calling `publicUserProfile`.
11. Returns both tokens and the public profile.

### Why the password is safe

The password is never returned to the frontend. The database stores the bcrypt
hash, and comparison happens on the backend.

## 26. Backend JWT Middleware: Exact Request Flow

For a protected request such as `GET /api/table/list`:

1. Axios sends the `Authorization` header.
2. Express reaches the table route.
3. `allowUser([...])` reads `req.headers.authorization`.
4. It rejects a missing header.
5. It requires the `Bearer ` prefix.
6. It extracts the token after that prefix.
7. `jwt.verify()` checks the signature and expiration.
8. The middleware checks `payload.type`.
9. Only access tokens are accepted for normal API requests.
10. The user ID in `payload.sub` is used to query MongoDB.
11. If no user exists, the request gets `401`.
12. The user profile is attached to `req.authUser`.
13. The user's role is normalized to lowercase.
14. Allowed roles are normalized in the same way.
15. A matching role calls `next()`.
16. A non-matching role returns `403`.
17. Controllers never need to trust a role sent by the browser.

This is why changing `localStorage` cannot grant real backend access.

## 27. Request Validation: Exact Flow

`bodyValidator(schema)` is a reusable middleware factory.

1. A route passes a Joi schema into `bodyValidator`.
2. The function returns an Express middleware function.
3. Express passes the request to that function.
4. The middleware reads `req.body`.
5. `schema.validateAsync(..., { abortEarly: false })` validates all fields.
6. If valid, `next()` sends control to the next route handler.
7. If invalid, Joi returns an error with `details`.
8. Each detail is converted into an `errBag` entry.
9. The middleware passes a structured 400 error to the error handler.
10. The controller is not executed for invalid input.

This same pattern is used for registration, staff creation, menu creation,
table creation, membership updates, and order updates.

## 28. Registration: File and Database Timeline

The complete registration timeline is:

```text
Register form
  -> multipart request
  -> Multer temporary file
  -> Joi validation
  -> Cloudinary upload
  -> bcrypt hash
  -> activation token
  -> UserModel.save()
  -> BullMQ email job
  -> SMTP delivery
  -> activation link
  -> account status true
```

Important implementation detail: if Cloudinary succeeds but MongoDB fails, the
controller checks `userData.image_id` and deletes the Cloudinary asset. This
prevents orphaned images.

## 29. Menu Request: Read Path

For a customer opening the menu:

1. `MenuPage` mounts.
2. Its loading state becomes true.
3. Axios sends `GET /api/menu/list`.
4. The menu router maps the request to `getAllMenuItems`.
5. No login middleware is used because the customer menu is public.
6. The menu service queries the bakery collection.
7. The controller returns menu data.
8. The frontend reads `response.data.result`.
9. It stores the array in React state.
10. React groups or renders items by category.
11. The loading state becomes false.
12. A failure displays an error toast or error state.

## 30. QR Ordering: Occupation Race

The table occupation operation is intentionally atomic:

1. The frontend sends a table number and session ID.
2. The service runs `findOneAndUpdate`.
3. The filter requires the matching table number and status `Available`.
4. The update changes the status to `Occupied`.
5. It stores `occupiedBy` as the browser session ID.
6. It resets billing fields to an unpaid, empty state.
7. MongoDB returns the updated table.
8. If no table is returned, the service checks whether this same session already
   owns the occupied table.
9. If the session owns it, the existing table is returned.
10. Otherwise the controller returns a conflict response.

Because the availability check and update are performed together, two customers
cannot both successfully claim the same available table through the normal
operation.

## 31. Cart Persistence

Cart state is intentionally client-side:

1. A menu card calls the add-to-cart handler.
2. The item, quantity, add-ons, and notes are represented as a cart line.
3. The cart is serialized to JSON.
4. JSON is stored under `bakery_cart`.
5. Floating cart components listen for cart update events.
6. Checkout reads and parses the same storage value.
7. A successful order removes the cart value.

The backend does not trust the cart total. The order service recalculates
important totals from the received items and current billing rules.

## 32. Checkout Calculation Flow

1. Checkout reads the table number from the active table state.
2. It reads cart lines from local storage.
3. It calculates a local subtotal for immediate display.
4. It optionally collects a discount code.
5. It optionally looks up a membership profile.
6. It sends the item and discount information to the billing preview endpoint.
7. The backend reads billing settings from MongoDB.
8. The backend calculates discount, tax, service charge, packaging charge, and
   final total.
9. The frontend displays the returned totals.
10. The final order request sends item details and membership information.
11. The backend calculates the authoritative final amount again.

The repeated backend calculation prevents a browser from changing only the
displayed price and paying an incorrect amount.

## 33. Order Creation: Database and Realtime Steps

1. Checkout sends `POST /api/order/`.
2. The order route validates the order body.
3. The controller calls `OrderService.createOrder`.
4. The service loads current settings.
5. It calculates item subtotal.
6. It applies the discount code if valid.
7. It applies membership discount if eligible.
8. It computes tax and service charge.
9. It computes the final total.
10. It creates an Order document.
11. MongoDB saves the document with status `Pending`.
12. The controller retrieves `io` from the Express application.
13. It emits `kitchen_new_order`.
14. Kitchen clients update their local order arrays.
15. The checkout page continues into counter or eSewa flow.

## 34. eSewa: Signature and Browser Form Details

The payment process has two separate requests.

### Request one: generate QR

1. Checkout already has an order ID.
2. It sends amount and transaction UUID to `/payment/esewa/qr`.
3. The backend loads the order by UUID.
4. It rejects an unknown order.
5. It verifies that the eSewa secret exists.
6. It builds a frontend payment URL.
7. It generates a QR image for that URL.
8. It changes the order payment status to `Pending`.
9. It returns the QR image.

### Request two: initialize payment after QR scan

1. The phone opens `/payment/pay/:orderId`.
2. The page loads the order status.
3. If already paid, it redirects to success.
4. It reads the authoritative order total.
5. It sends the total and order ID to `/payment/esewa/init`.
6. The backend reads the secret and merchant code from `.env`.
7. It creates the plaintext signed string:

   ```text
   total_amount=<amount>,transaction_uuid=<orderId>,product_code=<merchant>
   ```

8. HMAC-SHA256 signs that exact string.
9. The Base64 signature is returned.
10. The frontend creates a form element dynamically.
11. Hidden inputs are added for every eSewa field.
12. Required zero-valued service and delivery charge fields are included.
13. The form action points to the sandbox eSewa URL.
14. `form.submit()` sends the browser to eSewa.

### Callback

1. eSewa redirects to the backend success or failure URL.
2. The success controller decodes the returned Base64 payload.
3. It rebuilds the signed field string using `signed_field_names`.
4. It computes the expected HMAC.
5. It compares the expected and returned signatures.
6. It requires payment status `COMPLETE`.
7. It marks the order paid and stores the transaction code.
8. It refreshes the table billing summary.
9. It emits a billing update event.
10. It redirects the browser to the frontend success page.

The failure callback marks the order failed when a transaction UUID is present.

## 35. Polling and Socket.IO Together

Payment and order screens use two synchronization techniques:

- Polling checks the database status repeatedly.
- Socket.IO pushes events immediately when the backend changes data.

Polling is useful when the payment gateway callback has completed but a socket
event was missed. Socket.IO is useful because staff dashboards update without
waiting for the next interval.

## 36. Worker and Queue Execution

Background jobs use Redis so slow external operations do not block the HTTP
request.

### Email

1. A controller adds a job to `email-queue`.
2. Redis stores the job.
3. `email.worker.js` receives it.
4. `buildEmail()` chooses a template by job name.
5. The email service sends it through Nodemailer.
6. Failed jobs are reported through the worker failure event.

### WhatsApp fallback

1. Membership code delivery adds a WhatsApp job.
2. The WhatsApp worker calls the WhatsApp service.
3. If WhatsApp is unavailable, the worker adds an SMS job.
4. The SMS worker sends through Sparrow when configured.
5. If a provider is not configured, the result is reported as undelivered.

This design keeps registration and membership requests responsive.

## 37. Table Billing Calculation

`computeBillingFromOrders()`:

1. Receives all active orders for one table.
2. Filters out orders whose payment status is `Paid`.
3. Adds the `totalPrice` of unpaid orders.
4. Sets the status to `Paid` when no outstanding amount exists.
5. Sets `Failed` if any unpaid order failed.
6. Sets `Pending` if any unpaid order is pending.
7. Otherwise sets `Unpaid`.
8. Returns outstanding amount and active order count.

When staff settles a table:

1. The service loads active uncleared orders.
2. Each unpaid order becomes `Paid`.
3. Payment method becomes `Counter`.
4. `paidAt` receives the current time.
5. Membership payment history is updated.
6. Table billing is recalculated.
7. The table event is broadcast.

## 38. Error Scenarios and User Experience

### Unknown frontend URL

`path="*"` renders the frontend Error page.

### Unknown backend URL

Express creates a 404 error, and the error middleware returns JSON.

### Expired or missing token

`allowUser()` returns 401. The frontend clears local session data and sends the
user to login where the page implements that behavior.

### Valid token but wrong role

The backend returns 403. The frontend protected route also hides or refuses the
page.

### Occupied table

The customer sees a table-unavailable message and available table buttons
instead of a generic 404.

### Database unavailable

The backend waits at startup before listening, avoiding requests during the
initial MongoDB connection. Runtime database errors still reach the centralized
error handler.

### eSewa configuration missing

The payment endpoint returns a clear configuration error when
`ESEWA_SECRET_KEY` is absent.

## 39. File-by-File Presentation Map

Use this map when a teacher asks where a responsibility is implemented.

| Responsibility | Main file |
| --- | --- |
| React route registration | `Frontend/src/main.tsx` |
| Frontend authentication guard | `Frontend/src/components/ProtectedRoute.tsx` |
| Frontend API URLs | `Frontend/src/constants/constants.tsx` |
| Navigation and table QR claiming | `Frontend/src/components/header/header.tsx` |
| Login form | `Frontend/src/pages/Auth/Login/login.page.tsx` |
| Customer menu | `Frontend/src/pages/Menu/Menu.page.tsx` |
| Cart and checkout | `Frontend/src/pages/Checkout/CheckOut.page.tsx` |
| Payment handoff | `Frontend/src/pages/Payment/Pay/PaymentPay.page.tsx` |
| Error and alternative table choices | `Frontend/src/pages/ErrorPage/ErrorPage.tsx` |
| HTTP and Socket.IO startup | `Backend/index.js` |
| Express middleware | `Backend/src/config/express.config.js` |
| Database startup | `Backend/src/config/db.config.js` |
| Router registration | `Backend/src/config/router.config.js` |
| JWT verification and roles | `Backend/src/middleware/auth.middelware.js` |
| Joi request validation | `Backend/src/middleware/request.validator.js` |
| Login and account controller | `Backend/src/modules/auth/auth.controller.js` |
| User persistence logic | `Backend/src/modules/auth/auth.service.js` |
| Menu routes and operations | `Backend/src/modules/menu/` |
| Table routes and operations | `Backend/src/modules/table/` |
| Order routes and operations | `Backend/src/modules/order/` |
| Payment callbacks and signatures | `Backend/src/config/payment/` |
| Membership and OTP | `Backend/src/modules/membership/` |
| Billing configuration | `Backend/src/modules/settings/` |
| Sales reports | `Backend/src/modules/analytics/` |
| Background notifications | `Backend/src/queues/` |

## 40. Short Oral Explanation

“The application is a React frontend connected to an Express backend. React
handles pages, forms, local cart state, navigation, and realtime display. When
the user performs an action, the frontend calls a REST endpoint. Express
routes the request to a controller. Middleware verifies the JWT and validates
the input before the controller calls a service. Services contain the
business rules and use Mongoose models to read or write MongoDB. Socket.IO
notifies dashboards and tracking pages immediately when orders or table billing
change. Redis and BullMQ move email, SMS, and WhatsApp work into background
workers. Cloudinary stores images and eSewa processes online payments. The
backend remains the authority for authentication, roles, prices, order status,
and payment verification.”
