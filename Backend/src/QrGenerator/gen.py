import qrcode

user_input = input("Enter the URL or text you want to turn into a QR: ")

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)

qr.add_data(user_input)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
filename = "user_qr.png"
img.save(filename)

print(f"\nSuccess! QR code saved as {filename}")