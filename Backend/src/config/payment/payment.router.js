import express from 'express';
import {
  initiateEsewa,
  generateEsewaQr,
  esewaSuccess,
  esewaFailure,
} from './payment.controller.js';

const paymentRouter = express.Router();

paymentRouter.post('/payment/esewa/init', initiateEsewa);
paymentRouter.post('/payment/esewa/qr', generateEsewaQr);

paymentRouter.get('/payment/esewa/success', esewaSuccess);
paymentRouter.get('/payment/esewa/failure', esewaFailure);

export default paymentRouter;
