require("dotenv").config(); 
const express = require("express");

const app = express();
app.use(express.json());
// Create application/x-www-form-urlencoded parser

const { resetKarma } = require("./cronjob/functions");
const paymentRoutes = require('./routes/paymentRoutes');
const Stripe = require('stripe')

const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';



app.get("/", (req, res) => {
    // console.log(req.body)
    res.send(req.body.email);
});

app.post('/create-payment-intent', async (req, res) => {
    try {
        const { email, amount } = req.body || {};

        // console.log("Incoming payment intent")
        // console.log(req);

        if (!email || !amount) {
            return res.status(404).json({
                error: 'send email and amount',
            });
        }
        const { secret_key } = getKeys("tesing");
        const stripe = new Stripe(secret_key, {
            apiVersion: '2024-04-10',
            typescript: true,
        });

        const customer = await stripe.customers.create({ email });

        if (!customer) {
            return res.status(404).json({
                error: 'customer not created',
            });
        }

        // console.log("customer",customer)
        // Create a PaymentIntent with the order amount and currency.
        const params = {
            amount: amount,
            currency: "usd",
            customer: customer.id,
            payment_method_types: [
                'card',
                // 'us_bank_account',
                // 'affirm',
                // 'afterpay_clearpay',
                // 'klarna'
            ]
        };

        try {
            const paymentIntent = await stripe.paymentIntents.create(params);
            const ephemeralKey = await stripe.ephemeralKeys.create(
                { customer: customer.id },
                { apiVersion: '2024-04-10' }
            )
            // Send publishable key and PaymentIntent client_secret to client.
            return res.send({
                paymentIntent: paymentIntent.client_secret,
                ephemeralKey: ephemeralKey.secret,
                customer: customer.id
            });
        } catch (error) {
            console.log(error);
            return res.send({
                error: error.raw.message,
            });

        }

    } catch (error) {
        return res.send({
            error: error.raw.message,
        });
    }

});

function getKeys(payment_method) {
    let secret_key = stripeSecretKey;
    let publishable_key= stripePublishableKey;

    switch (payment_method) {
        case 'grabpay':
        case 'fpx':
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY_MY;
            secret_key = process.env.STRIPE_SECRET_KEY_MY;
            break;
        case 'au_becs_debit':
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY_AU;
            secret_key = process.env.STRIPE_SECRET_KEY_AU;
            break;
        case 'oxxo':
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY_MX;
            secret_key = process.env.STRIPE_SECRET_KEY_MX;
            break;
        case 'wechat_pay':
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY_WECHAT;
            secret_key = process.env.STRIPE_SECRET_KEY_WECHAT;
            break;
        case 'paypal':
        case 'revolut_pay':
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY_UK;
            secret_key = process.env.STRIPE_SECRET_KEY_UK;
            break;
        default:
            publishable_key = process.env.STRIPE_PUBLISHABLE_KEY;
            secret_key = process.env.STRIPE_SECRET_KEY;
    }

    return { secret_key, publishable_key };
}


resetKarma()

app.use('/payments', paymentRoutes);

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;