// Quick test to check if SMTP env vars are loaded
console.log("=== SMTP Configuration Check ===");
console.log("SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
console.log("SMTP_USER:", process.env.SMTP_USER ? "SET (hidden)" : "NOT SET");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "SET (hidden)" : "NOT SET");
console.log("================================");
