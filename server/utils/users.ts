import bcrypt from "bcryptjs";
import { storage } from "../storage";
import type { InsertUser } from "@shared/schema";

export async function initializeTestUser() {
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

export async function initializeWebChannel() {
  const webChannelName = "web";
  const existingChannel = await storage.getChannelByName(webChannelName);
  
  if (!existingChannel) {
    await storage.createChannel({
      name: webChannelName,
      description: "Canal Web Padrão",
      type: "web",
      isActive: "true",
    });
    console.log("✅ Canal 'web' criado automaticamente");
  }
}
