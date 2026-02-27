import { sign } from "hono/jwt";
import { User } from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// --- Password helpers using Web Crypto API (PBKDF2) ---

const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
    );
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
    const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
    return `${saltHex}:${hashHex}`;
};

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
    const [saltHex, hashHex] = stored.split(":");
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial, 256
    );
    const computedHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
    return computedHex === hashHex;
};

// --- Auth ---

// POST /api/auth/register
export const registerUser = async (c: any) => {
    try {
        const { username, email, password, ...rest } = await c.req.json();

        if (!username || !email || !password) {
            return c.json({ message: "username, email, and password are required" }, 400);
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return c.json({ message: "Username or email already taken" }, 409);
        }

        const hashedPassword = await hashPassword(password);
        const user = await User.create({ username, email, password: hashedPassword, ...rest });

        const token = await sign(
            { id: user._id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
            JWT_SECRET, "HS256"
        );

        return c.json({ token, user: { id: user._id, username: user.username, email: user.email } }, 201);
    } catch (error) {
        return c.json({ message: "Error registering user" }, 500);
    }
};

// POST /api/auth/login
export const loginUser = async (c: any) => {
    try {
        const { email, password } = await c.req.json();

        if (!email || !password) {
            return c.json({ message: "email and password are required" }, 400);
        }

        const user = await User.findOne({ email });
        if (!user) {
            return c.json({ message: "Invalid credentials" }, 401);
        }

        const valid = await verifyPassword(password, user.password);
        if (!valid) {
            return c.json({ message: "Invalid credentials" }, 401);
        }

        const token = await sign(
            { id: user._id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 },
            JWT_SECRET, "HS256"
        );

        return c.json({ token, user: { id: user._id, username: user.username, email: user.email } }, 200);
    } catch (error) {
        return c.json({ message: "Error logging in" }, 500);
    }
};

// --- User CRUD ---

// GET /api/users/:id
export const getUserById = async (c: any) => {
    const userId = c.req.param("id");
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return c.json({ message: "User not found" }, 404);
        }
        return c.json(user, 200);
    } catch (error) {
        return c.json({ message: "Error retrieving user" }, 500);
    }
};

// GET /api/users
export const getAllUser = async (c: any) => {
    try {
        const users = await User.find().select("-password");
        return c.json(users, 200);
    } catch (error) {
        return c.json({ message: "Error retrieving users" }, 500);
    }
};

// PUT /api/users/:id
export const updateUser = async (c: any) => {
    const userId = c.req.param("id");
    try {
        const data = await c.req.json();

        // Prevent direct password update through this route
        delete data.password;

        const user = await User.findByIdAndUpdate(userId, data, { new: true }).select("-password");
        if (!user) {
            return c.json({ message: "User not found" }, 404);
        }
        return c.json(user, 200);
    } catch (error) {
        return c.json({ message: "Error updating user" }, 500);
    }
};

// DELETE /api/users/:id
export const deleteUser = async (c: any) => {
    const userId = c.req.param("id");
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return c.json({ message: "User not found" }, 404);
        }
        return c.json({ message: "User deleted successfully" }, 200);
    } catch (error) {
        return c.json({ message: "Error deleting user" }, 500);
    }
};
