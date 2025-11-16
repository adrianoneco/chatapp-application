import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertUserSchema,
  updateUserSchema,
  insertConversationSchema,
  insertMessageSchema,
  type User 
} from "@shared/schema";
import bcrypt from "bcryptjs";
import session from "express-session";
import createMemoryStore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";

const MemoryStore = createMemoryStore(session);

const uploadDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif)'));
    }
  }
});

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
      role: "attendant",
      avatarUrl: null,
    });
    console.log("✅ Usuário teste criado: username='teste', password='senha123', role='attendant'");
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

function requireAttendant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== "attendant") {
    return res.status(403).json({ error: "Acesso negado. Apenas atendentes podem realizar esta ação." });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "chatwave-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, (req, res, next) => {
    const uploadsPath = path.join(process.cwd(), "uploads");
    return (req as any).viteDevMiddleware 
      ? next()
      : require("express").static(uploadsPath)(req, res, next);
  });

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

  app.post("/api/upload/avatar", authenticateMiddleware, upload.single("avatar"), (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      return res.json({ avatarUrl });
    } catch (error: any) {
      console.error("Upload error:", error);
      return res.status(500).json({ error: error.message || "Erro ao fazer upload" });
    }
  });

  app.get("/api/users/attendants", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const attendants = await storage.getUsersByRole("attendant");
      const sanitizedAttendants = attendants.map(({ password, ...user }) => user);
      return res.json(sanitizedAttendants);
    } catch (error) {
      console.error("Get attendants error:", error);
      return res.status(500).json({ error: "Erro ao buscar atendentes" });
    }
  });

  app.post("/api/users/attendants", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse({ ...req.body, role: "attendant" });
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Create attendant error:", error);
      return res.status(400).json({ error: "Erro ao criar atendente" });
    }
  });

  app.patch("/api/users/attendants/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userData = updateUserSchema.parse(req.body);

      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "Atendente não encontrado" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update attendant error:", error);
      return res.status(400).json({ error: "Erro ao atualizar atendente" });
    }
  });

  app.delete("/api/users/attendants/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({ error: "Você não pode deletar sua própria conta" });
      }

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Atendente não encontrado" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Delete attendant error:", error);
      return res.status(500).json({ error: "Erro ao deletar atendente" });
    }
  });

  app.get("/api/users/clients", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const clients = await storage.getUsersByRole("client");
      const sanitizedClients = clients.map(({ password, ...user }) => user);
      return res.json(sanitizedClients);
    } catch (error) {
      console.error("Get clients error:", error);
      return res.status(500).json({ error: "Erro ao buscar contatos" });
    }
  });

  app.post("/api/users/clients", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse({ ...req.body, role: "client" });
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Nome de usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Create client error:", error);
      return res.status(400).json({ error: "Erro ao criar contato" });
    }
  });

  app.patch("/api/users/clients/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userData = updateUserSchema.parse(req.body);

      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ error: "Contato não encontrado" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update client error:", error);
      return res.status(400).json({ error: "Erro ao atualizar contato" });
    }
  });

  app.delete("/api/users/clients/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Contato não encontrado" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Delete client error:", error);
      return res.status(500).json({ error: "Erro ao deletar contato" });
    }
  });

  app.get("/api/conversations", authenticateMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversations = req.user?.role === "attendant"
        ? await storage.getAllConversations()
        : await storage.getConversationsByUser(req.user!.id);

      return res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      return res.status(500).json({ error: "Erro ao buscar conversas" });
    }
  });

  app.get("/api/conversations/:id", authenticateMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      if (req.user?.role !== "attendant" && 
          conversation.attendantId !== req.user?.id && 
          conversation.clientId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      return res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      return res.status(500).json({ error: "Erro ao buscar conversa" });
    }
  });

  app.post("/api/conversations", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(conversationData);

      return res.json(conversation);
    } catch (error: any) {
      console.error("Create conversation error:", error);
      return res.status(400).json({ error: error.message || "Erro ao criar conversa" });
    }
  });

  app.patch("/api/conversations/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const conversationData = insertConversationSchema.partial().parse(req.body);

      const conversation = await storage.updateConversation(id, conversationData);
      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      return res.json(conversation);
    } catch (error) {
      console.error("Update conversation error:", error);
      return res.status(400).json({ error: "Erro ao atualizar conversa" });
    }
  });

  app.delete("/api/conversations/:id", authenticateMiddleware, requireAttendant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const deleted = await storage.deleteConversation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Delete conversation error:", error);
      return res.status(500).json({ error: "Erro ao deletar conversa" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      if (req.user?.role !== "attendant" && 
          conversation.attendantId !== req.user?.id && 
          conversation.clientId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const messages = await storage.getMessagesByConversation(id);
      return res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      return res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      if (req.user?.role !== "attendant" && 
          conversation.attendantId !== req.user?.id && 
          conversation.clientId !== req.user?.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId: id,
        senderId: req.user!.id,
      });

      const message = await storage.createMessage(messageData);
      return res.json(message);
    } catch (error) {
      console.error("Create message error:", error);
      return res.status(400).json({ error: "Erro ao enviar mensagem" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
