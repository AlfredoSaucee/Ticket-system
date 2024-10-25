const Imap =  require('imap');
const {simpleParser} = require('mailparser');
const nodeMailer =  require('nodemailer');
const db    = require("../src/functions.js");
const config = require("../config/config.json");

const imapConfig = {
    user: config.imap.user,
    password: config.imap.password,
    host:  'imap.gmail.com',
    port:  993,
    tls: true,
    tlsOptions: {
        rejectUnauthorized: false
    }
};

const nodeMailerConfig = nodeMailer.createTransport({
    service: "gmail",
    auth:  {
        user: 'ticket.system1414@gmail.com',
        pass:  'jzqj qufl qjep krii'
    }
})

// Function to recieve emails and create ticket
function getMail() {
    const imap = new Imap(imapConfig);

    imap.once("ready", () => {
        console.log("IMAP Connection Ready");
        imap.openBox("INBOX", false, ()=>{
            imap.on("mail", ()=>{
                imap.search(["UNSEEN"], (error, results)=>{
                    const message = imap.fetch(results, {bodies:""});
                    message.on("message", (msg)=>{
                        msg.on("body", stream=> {
                            simpleParser(stream, async(error, parsed)=>{
                                console.log(parsed.text);
                                await db.createTicket(parsed.subject, parsed.text.split("\n")[0],"","","",parsed.from.value[0].address);
                            })
                        })
                        msg.once("attributes", attrs=>{
                            const {uid} = attrs;
                            imap.addFlags(uid,  ["\\SEEN"]);

                        });
                    })
                })
            })
        })
    });

    imap.once("error", (err) => {
        console.error("IMAP Connection Error: ", err);
    });

    imap.once("close", (hasError) => {
        console.log("IMAP Connection Closed: ", hasError ? 'with error' : 'cleanly');
    });

    imap.once("end", () => {
        console.log("IMAP Connection Ended");
    });

    // Initiate the connection
    imap.connect();
}

//Function to send email on ticket update
function sendEmail(ticketId, reciever) {
    const options = {
        from: 'ticket.system1414@gmail.com',
        to: reciever,
        subject: 'Ticket Update',
        text: `Ticket ${ticketId} has been updated`
    };

    nodeMailerConfig.sendMail(options);
}

getMail();
