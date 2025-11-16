import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, type User } from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

async function initializeTestUser() {
  const testUsername = "teste";
  const existingUser = await storage.getUserByUsername(testUsername);
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("senha123", 10);
    await storage.createUser({
      username: testUsername,
      password: hashedPassword,
      name: "Usuário Teste",
    });
    console.log("✅ Usuário teste criado: username='teste', password='senha123'");
  }
}

async function authenticateMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Usuário não encontrado" });
  }

  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "chatwave-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000, // 24 horas
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      },
    })
  );

  await initializeTestUser();

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(credentials.username);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.userId = user.id;
      
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  app.get("/api/auth/me", authenticateMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const { password, ...userWithoutPassword } = req.user;
    return res.json(userWithoutPassword);
  });

  const httpServer = createServer(app);

  return httpServer;
}
