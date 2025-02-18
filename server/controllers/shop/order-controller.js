//const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const createOrder = async (req, res) => {
  try {
    const { cartItems, totalAmount, userId, cartId, addressInfo, orderStatus, paymentMethod, paymentStatus, orderDate, orderUpdateDate } = req.body.products;

    // Prepare the line items for Stripe
    console.log(cartItems, "cartItems");
    const lineItems = cartItems?.map(item => ({
      price_data: {
        currency: 'usd', // Or the currency you're using
        product_data: {
          name: item.title,
          
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects the amount in cents
      },
      quantity: item.quantity,
    }));

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:5173/shop/paypal-return', // Change the URL to your success page
      cancel_url: 'http://localhost:5173/shop/paypal-cancel', // Change the URL to your cancel page
    });

    // Create a new order in your database
    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod: 'Stripe', // Payment method is now Stripe
      paymentStatus:"success",
      totalAmount,
      orderDate,
      orderUpdateDate,
      paymentId: session.id, // Use the Stripe session ID as paymentId
      payerId: null, // Stripe doesn't return payerId like PayPal
    });

    await newlyCreatedOrder.save();

    // Send the checkout session URL to the frontend
    res.status(201).json({
      success: true,
      sessionId: session.id, // Send session ID to frontend to handle redirect
      orderId: newlyCreatedOrder._id,
    });
  } catch (error) {
    console.error('Error during Stripe checkout session creation:', error);
    res.status(500).json({
      success: false,
      message: 'Error while creating Stripe checkout session',
    });
  }



  // try {
  //   const {
  //     userId,
  //     cartItems,
  //     addressInfo,
  //     orderStatus,
  //     paymentMethod,
  //     paymentStatus,
  //     totalAmount,
  //     orderDate,
  //     orderUpdateDate,
  //     paymentId,
  //     payerId,
  //     cartId,
  //   } = req.body;
  //   const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  //   const lineItems = cartItems.map((item) => ({
  //     price_data: {
  //       currency: "usd",
  //       product_data: {
  //         name: item.title,
  //       },
  //       unit_amount: item.price * 100,
  //     },
  //     quantity: item.quantity,
  //   }));

  //   const session = await stripe.checkout.sessions.create({
  //     payment_method_types: ["card"],
  //     line_items: lineItems,
  //     mode: "payment",
  //     success_url: "http://localhost:5173/shop/paypal-return",
  //     cancel_url: "http://localhost:5173/shop/paypal-cancel",
  //   });

  //   const newlyCreatedOrder = new Order({
  //     userId,
  //     cartId,
  //     cartItems,
  //     addressInfo,
  //     orderStatus,
  //     paymentMethod,
  //     paymentStatus,
  //     totalAmount,
  //     orderDate,
  //     orderUpdateDate,
  //     paymentId: session.payment_intent,
  //     payerId: session.customer,
  //   });

  //   await newlyCreatedOrder.save();

  //   res.status(201).json({
  //     success: true,
  //     checkoutSessionId: session.id,
  //     orderId: newlyCreatedOrder._id,
  //   });
  //   // const create_payment_json = {
  //   //   intent: "sale",
  //   //   payer: {
  //   //     payment_method: "paypal",
  //   //   },
  //   //   redirect_urls: {
  //   //     return_url: "http://localhost:5173/shop/paypal-return",
  //   //     cancel_url: "http://localhost:5173/shop/paypal-cancel",
  //   //   },
  //   //   transactions: [
  //   //     {
  //   //       item_list: {
  //   //         items: cartItems.map((item) => ({
  //   //           name: item.title,
  //   //           sku: item.productId,
  //   //           price: item.price.toFixed(2),
  //   //           currency: "USD",
  //   //           quantity: item.quantity,
  //   //         })),
  //   //       },
  //   //       amount: {
  //   //         currency: "USD",
  //   //         total: totalAmount.toFixed(2),
  //   //       },
  //   //       description: "description",
  //   //     },
  //   //   ],
  //   // };

  //   // paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
  //   //   if (error) {
  //   //     console.log(error);

  //   //     return res.status(500).json({
  //   //       success: false,
  //   //       message: "Error while creating paypal payment",
  //   //     });
  //   //   } else {
  //   //     const newlyCreatedOrder = new Order({
  //   //       userId,
  //   //       cartId,
  //   //       cartItems,
  //   //       addressInfo,
  //   //       orderStatus,
  //   //       paymentMethod,
  //   //       paymentStatus,
  //   //       totalAmount,
  //   //       orderDate,
  //   //       orderUpdateDate,
  //   //       paymentId,
  //   //       payerId,
  //   //     });

  //   //     await newlyCreatedOrder.save();

  //   //     const approvalURL = paymentInfo.links.find(
  //   //       (link) => link.rel === "approval_url"
  //   //     ).href;

  //   //     res.status(201).json({
  //   //       success: true,
  //   //       approvalURL,
  //   //       orderId: newlyCreatedOrder._id,
  //   //     });
  //   //   }
  //   // });
  // } catch (e) {
  //   //console.log(e);
  //   res.status(500).json({
  //     success: false,
  //     message: "Some error occured!",
  //   });
  // }
  
  //res.sendStatus(200);
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order can not be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Not enough stock for this product ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;

      await product.save();
    }

    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId);

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
