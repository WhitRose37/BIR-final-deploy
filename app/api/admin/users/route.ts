import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    avatar: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count(),
        ]);

        return NextResponse.json({
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "OWNER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name, email, password, role } = body;

        if (role === "OWNER" && currentUser.role !== "OWNER") {
            return NextResponse.json({ error: "Only OWNER can create OWNER accounts" }, { status: 403 });
        }

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                name,
                email,
                passwordHash,
                role: role || "USER",
                status: "ACTIVE",
                updatedAt: new Date(),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json(newUser);
    } catch (e: any) {
        console.error("Create user error:", e);
        return NextResponse.json({ error: e?.message || "Failed to create user" }, { status: 500 });
    }
}
