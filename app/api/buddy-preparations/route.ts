import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can view buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationIdFromQuery = searchParams.get("organizationId");
    const debug = searchParams.get("debug") === "true";

    // Determine effective organization to scope results to.
    // Default to the user's organization. Super admins may override with query param.
    const effectiveOrganizationId = organizationIdFromQuery || session.user.organizationId || undefined;

    if (!effectiveOrganizationId) {
      // If no organization context is available, don't leak data
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    const whereClause = { organizationId: effectiveOrganizationId };

    if (debug) {
      console.log("Buddy preparations debug - whereClause:", whereClause);
      console.log("User organizationId:", session.user.organizationId);
      console.log("User role:", session.user.role);
    }

    const preparations = await prisma.buddyPreparation.findMany({
      where: whereClause,
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { isActive: "desc" }, // Active preparations first
        { createdAt: "desc" },
      ],
    });

    if (debug) {
      console.log("Found buddy preparations:", preparations.map(p => ({
        id: p.id,
        email: p.email,
        firstName: p.firstName,
        lastName: p.lastName,
        isActive: p.isActive,
        organizationId: p.organizationId,
        userId: p.userId
      })));
    }

    // Calculate stats
    const stats = {
      total: preparations.length,
      active: preparations.filter(p => p.isActive).length,
      completed: preparations.filter(p => !p.isActive).length,
    };

    return NextResponse.json({
      data: preparations,
      stats,
    });
  } catch (error) {
    console.error("Error fetching buddy preparations:", error);
    return NextResponse.json(
      { error: "Failed to fetch buddy preparations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and SUPER_ADMIN can create buddy preparations
    if (!session.user.role || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, buddyId, additionalBuddyId, organizationId: organizationIdFromBody, notes, testEmail, fixEmails } = body;

    // Resolve the organization to operate on:
    // - Admins are always scoped to their own org
    // - Super admins can specify via body or fall back to their session org (if any)
    const resolvedOrganizationId =
      session.user.role === "SUPER_ADMIN"
        ? (organizationIdFromBody || session.user.organizationId)
        : session.user.organizationId;

    if (!resolvedOrganizationId) {
      return NextResponse.json(
        { error: "organizationId is required (provide it or ensure your user belongs to an organization)" },
        { status: 400 }
      );
    }

    // If this is a test request to check email matching
    if (testEmail) {
      console.log(`Testing email matching for: ${testEmail}`);

      const testPreparations = await prisma.buddyPreparation.findMany({
        where: {
          organizationId: resolvedOrganizationId,
          isActive: true,
        },
      });

      console.log(`Found ${testPreparations.length} active preparations in organization`);

      const testEmailLower = testEmail.toLowerCase().trim();
      const exactMatch = testPreparations.find(p => p.email === testEmailLower);
      const caseInsensitiveMatch = testPreparations.find(p => p.email?.toLowerCase().trim() === testEmailLower);
      const domainMatch = testPreparations.find(p => {
        if (!p.email) return false;
        const prepDomain = p.email.toLowerCase().split('@')[1];
        const testDomain = testEmailLower.split('@')[1];
        return prepDomain && testDomain && prepDomain === testDomain;
      });

      return NextResponse.json({
        testEmail,
        testEmailLower,
        totalPreparations: testPreparations.length,
        exactMatch: exactMatch ? { id: exactMatch.id, email: exactMatch.email } : null,
        caseInsensitiveMatch: caseInsensitiveMatch ? { id: caseInsensitiveMatch.id, email: caseInsensitiveMatch.email } : null,
        domainMatch: domainMatch ? { id: domainMatch.id, email: domainMatch.email } : null,
        allPreparations: testPreparations.map(p => ({
          id: p.id,
          email: p.email,
          emailLower: p.email?.toLowerCase().trim(),
          firstName: p.firstName,
          lastName: p.lastName
        }))
      });
    }

    // If this is a request to fix email formatting
    if (fixEmails) {
      console.log('Fixing email formatting in buddy preparations...');

      const allPreparations = await prisma.buddyPreparation.findMany({
        where: {
          organizationId: resolvedOrganizationId,
        },
      });

      let fixedCount = 0;
      for (const prep of allPreparations) {
        if (prep.email && prep.email !== prep.email.toLowerCase().trim()) {
          await prisma.buddyPreparation.update({
            where: { id: prep.id },
            data: { email: prep.email.toLowerCase().trim() }
          });
          fixedCount++;
        }
      }

      return NextResponse.json({
        message: `Fixed ${fixedCount} email formatting issues`,
        totalPreparations: allPreparations.length,
        fixedCount
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !buddyId) {
      return NextResponse.json(
        { error: "firstName, lastName and buddyId are required" },
        { status: 400 }
      );
    }

    // Validate that admin can only create for their organization (we already resolved it, but keep a guard)
    if (session.user.role === "ADMIN" && resolvedOrganizationId !== session.user.organizationId) {
      return NextResponse.json({ error: "Can only create preparations for your own organization" }, { status: 403 });
    }

    // Validate that buddy exists and belongs to the organization
    const buddy = await prisma.user.findFirst({
      where: {
        id: buddyId,
          organizationId: resolvedOrganizationId,
      },
    });

    if (!buddy) {
      return NextResponse.json(
        { error: "Buddy not found or does not belong to the specified organization" },
        { status: 400 }
      );
    }

    // Check if organization has buddy system enabled
    const organization = await prisma.organization.findUnique({
      where: { id: resolvedOrganizationId },
    });

    if (!organization?.buddyEnabled) {
      return NextResponse.json(
        { error: "Buddy system is not enabled for this organization" },
        { status: 400 }
      );
    }

    // Check for existing active preparation with same email in same organization
    if (email) {
      const emailNormalized = email.toLowerCase().trim();
      const existingPreparation = await prisma.buddyPreparation.findUnique({
        where: {
          email_organizationId: {
            email: emailNormalized,
            organizationId: resolvedOrganizationId,
          },
        },
      });

      if (existingPreparation && existingPreparation.isActive) {
        return NextResponse.json(
          { error: "Active buddy preparation already exists for this email in this organization" },
          { status: 400 }
        );
      }
    }

    // Create the buddy preparation
    const preparation = await prisma.buddyPreparation.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email ? email.toLowerCase().trim() : null,
        buddyId,
        organizationId: resolvedOrganizationId,
        notes: notes?.trim() || null,
      },
      include: {
        buddy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            buddyEnabled: true,
          },
        },
      },
    });

    // If an additional buddy is provided, attach via BuddyPreparationBuddy
    if (additionalBuddyId) {
      await prisma.buddyPreparationBuddy.create({
        data: {
          buddyPreparationId: preparation.id,
          buddyId: additionalBuddyId,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: preparation,
      message: "Buddy preparation created successfully",
    });
  } catch (error) {
    console.error("Error creating buddy preparation:", error);
    return NextResponse.json(
      { error: "Failed to create buddy preparation" },
      { status: 500 }
    );
  }
}