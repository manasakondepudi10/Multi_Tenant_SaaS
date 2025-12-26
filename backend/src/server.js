import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool, testDBConnection } from "./config/db.js";
import { authenticateJWT } from "./middleware/auth.js";
import { authorizeRoles } from "./middleware/rbac.js";
import { isolateTenant } from "./middleware/tenantIsolation.js";
import { logAudit } from "./utils/auditLogger.js";

dotenv.config();

const app = express();
app.use(express.json());

// CORS for Docker + Local
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Health Check
app.get("/api/health", async (req, res) => {
  try {
    await testDBConnection();
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(500).json({ status: "fail", database: "not connected" });
  }
});

// Example Protected Route Test
app.get("/api/tenants", authenticateJWT, isolateTenant, authorizeRoles("super_admin"), async (req, res) => {
  res.status(200).json({ success: true, message: "Super admin access OK" });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  const tenant = await pool.query(`SELECT * FROM tenants WHERE subdomain = $1`, [tenantSubdomain]);
  if (tenant.rowCount === 0) {
    return res.status(404).json({ success: false, message: "Tenant not found" });
  }

  const user = await pool.query(`SELECT * FROM users WHERE email = $1 AND tenant_id = $2`, [email, tenant.rows[0].id]);
  if (user.rowCount === 0) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const validPass = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!validPass) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.rows[0].id, tenantId: user.rows[0].tenant_id, role: user.rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  await logAudit({
    tenantId: user.rows[0].tenant_id,
    userId: user.rows[0].id,
    action: "LOGIN",
    entityType: "auth",
    entityId: user.rows[0].id,
    ip: req.ip
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { token, expiresIn: 86400 }
  });
});

// Start Server
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
