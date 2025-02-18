// require('dotenv').config();
// const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY);
// exports.checkout = async (req, res) => {
//     const  product  = req.body.products;

    

//     try {
//         const session = await stripe.checkout.sessions.create({
//             products: product,
//             mode: 'payment',

//         });

//         res.json({ id: session.id });
//     } catch (error) {
//         console.error('Error creating checkout session:', error);
//         res.status(500).send('Internal Server Error');
//     }
// };

