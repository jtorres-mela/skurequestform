import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(
  req: Request,
  context: { params: { submissionId: string; productId: string } } | { params: Promise<{ submissionId: string; productId: string }> }
) {
  // Await params if it's a Promise (Next.js app directory dynamic route requirement)
  const params = 'then' in context.params ? await context.params : context.params;
  const submissionId = Number(params.submissionId);
  const productId = Number(params.productId);

  if (!Number.isFinite(submissionId) || !Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const product = await prisma.submissionProduct.findUnique({
      where: { id: productId },
      include: {
        accessories: true,
        recommendations: true,
        cultures: true,
      },
    });

    if (!product || product.submissionId !== submissionId) {
      return NextResponse.json(
        { error: "Product not found for this submission" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
