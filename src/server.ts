import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 4000;

// Safety net: агар хатогие берун аз занҷираи Express (масалан дар як async кор,
// на дар дохили дархост) ба вуҷуд ояд, сервер бояд лог кунад, на crash кунад.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

app.listen(PORT, () => {
  console.log(`Omuz CRM backend is running on port ${PORT}`);
});
