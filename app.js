javascript
require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const sessions = {};
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID

async function sendWhatsAppMessage(payload) {

    try {

        const response = await axios.post(
            `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("Message Sent:", response.data);

    } catch (err) {

        console.error("WhatsApp API Error");

        if (err.response) {
            console.error(JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }

    }

}

async function sendTextMessage(to, message) {

    const payload = {

        messaging_product: "whatsapp",

        recipient_type: "individual",

        to: to,

        type: "text",

        text: {

            preview_url: false,

            body: message

        }

    };

    await sendWhatsAppMessage(payload);

}

async function sendLanguageMenu(to) {

    const payload = {

        messaging_product: "whatsapp",

        recipient_type: "individual",

        to: to,

        type: "interactive",

        interactive: {

            type: "button",

            body: {

                text:
`👋 Welcome to Kaduthuruthy MLA Connect

Please select your preferred language.`

            },

            footer: {

                text: "MLA Office"

            },

            action: {

                buttons: [

                    {

                        type: "reply",

                        reply: {

                            id: "LANG_EN",

                            title: "English"

                        }

                    },

                    {

                        type: "reply",

                        reply: {

                            id: "LANG_ML",

                            title: "മലയാളം"

                        }

                    }

                ]

            }

        }

    };

    await sendWhatsAppMessage(payload);

}


async function sendEnglishMainMenu(to) {

    const payload = {

        messaging_product: "whatsapp",

        to: to,

        type: "interactive",

        interactive: {

            type: "button",

            body: {

                text:
`Welcome to Kaduthuruthy MLA Connect

How can we help you today?`

            },

            footer: {

                text: "Choose an option"

            },

            action: {

                buttons: [

                    {

                        type: "reply",

                        reply: {

                            id: "REGISTER_COMPLAINT",

                            title: "Complaint"

                        }

                    },

                    {

                        type: "reply",

                        reply: {

                            id: "CHANGE_LANGUAGE",

                            title: "Language"

                        }

                    },

                    {

                        type: "reply",

                        reply: {

                            id: "HELP",

                            title: "Help"

                        }

                    }

                ]

            }

        }

    };

    await sendWhatsAppMessage(payload);

}


async function sendMalayalamMainMenu(to) {

    const payload = {

        messaging_product: "whatsapp",

        to: to,

        type: "interactive",

        interactive: {

            type: "button",

            body: {

                text:
`കടുത്തുരുത്തി MLA Connect ലേക്ക് സ്വാഗതം

ദയവായി ഒരു ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക.`

            },

            footer: {

                text: "MLA ഓഫീസ്"

            },

            action: {

                buttons: [

                    {

                        type: "reply",

                        reply: {

                            id: "REGISTER_COMPLAINT",

                            title: "പരാതി"

                        }

                    },

                    {

                        type: "reply",

                        reply: {

                            id: "CHANGE_LANGUAGE",

                            title: "ഭാഷ"

                        }

                    },

                    {

                        type: "reply",

                        reply: {

                            id: "HELP",

                            title: "സഹായം"

                        }

                    }

                ]

            }

        }

    };

    await sendWhatsAppMessage(payload);

}

app.get("/", (req, res) => {

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {

        console.log("✅ WEBHOOK VERIFIED");

        return res.status(200).send(challenge);

    }

    return res.sendStatus(403);

});



app.post("/", async (req, res) => {

    const timestamp = new Date().toISOString();

    console.log("\n========================================");
    console.log("Webhook Received :", timestamp);
    console.log("========================================");

    console.log(JSON.stringify(req.body, null, 2));

    try {

        const message =
            req.body.entry?.[0]
                ?.changes?.[0]
                ?.value?.messages?.[0];

        if (!message) {

            return res.sendStatus(200);

        }

        const phone = message.from;

        console.log("Phone :", phone);



        if (!sessions[phone]) {

            sessions[phone] = {

                stage: "START",

                language: null

            };

            console.log("New Session Created");

        }

        const session = sessions[phone];

        //---------------------------------------------------
        // TEXT MESSAGE
        //---------------------------------------------------

        if (message.type === "text") {

            const text = message.text.body.trim();

            console.log("Text :", text);

            session.stage = "LANGUAGE";

            await sendLanguageMenu(phone);

        }

        //---------------------------------------------------
        // BUTTON CLICK
        //---------------------------------------------------

        else if (message.type === "interactive") {

            const buttonId =
                message.interactive.button_reply.id;

            console.log("Button :", buttonId);

            switch (buttonId) {

                //---------------------------------------------
                // English
                //---------------------------------------------

                case "LANG_EN":

                    session.language = "EN";

                    session.stage = "MAIN_MENU";

                    console.log("Language = English");

                    await sendEnglishMainMenu(phone);

                    break;

                //---------------------------------------------
                // Malayalam
                //---------------------------------------------

                case "LANG_ML":

                    session.language = "ML";

                    session.stage = "MAIN_MENU";

                    console.log("Language = Malayalam");

                    await sendMalayalamMainMenu(phone);

                    break;

                //---------------------------------------------
                // Complaint
                //---------------------------------------------

                case "REGISTER_COMPLAINT":

                    await sendTextMessage(
                        phone,
                        "🚧 Complaint Registration is under development."
                    );

                    break;

                //---------------------------------------------
                // Change Language
                //---------------------------------------------

                case "CHANGE_LANGUAGE":

                    session.stage = "LANGUAGE";

                    await sendLanguageMenu(phone);

                    break;

                //---------------------------------------------
                // Help
                //---------------------------------------------

                case "HELP":

                    if (session.language === "ML") {

                        await sendTextMessage(
                            phone,
                            "സഹായ വിഭാഗം ഉടൻ ലഭ്യമാകും."
                        );

                    } else {

                        await sendTextMessage(
                            phone,
                            "Help section will be available soon."
                        );

                    }

                    break;

                //---------------------------------------------
                // Unknown Button
                //---------------------------------------------

                default:

                    await sendTextMessage(
                        phone,
                        "Unknown option selected."
                    );

            }

        }

    }
    catch (err) {

        console.error("Webhook Error");

        if (err.response) {

            console.error(JSON.stringify(err.response.data, null, 2));

        } else {

            console.error(err);

        }

    }

    res.sendStatus(200);

});

app.listen(PORT, () => {

    console.log("====================================");
    console.log("Kaduthuruthy MLA WhatsApp Bot");
    console.log("Listening on Port :", PORT);
    console.log("====================================");

});
