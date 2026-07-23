import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { executionHistory, executions } from "../../../db/schema";

const isClosedPeriod = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return true;
  return new Date() >= new Date(year, month, 1);
};

export async function GET() {
  try {
    const db = await getDb();
    return Response.json({
      executions: await db.select().from(executions),
      history: await db.select().from(executionHistory),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível consultar os lançamentos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "Usuário não identificado." }, { status: 401 });

    const body = (await request.json()) as {
      contract?: string;
      item?: string;
      serviceOrder?: string;
      period?: string;
      week?: number;
      quantity?: number;
      action?: "save" | "lock" | "unlock";
    };
    const contract = body.contract?.trim() ?? "";
    const item = body.item?.trim() ?? "";
    const serviceOrder = body.serviceOrder?.trim() ?? "";
    const period = body.period?.trim() ?? "";
    const week = Number(body.week);
    const quantity = Number(body.quantity);
    const action = body.action ?? "save";

    if (!contract || !item || !serviceOrder || !/^\d{4}-\d{2}$/.test(period) || !Number.isInteger(week) || week < 1 || week > 5) {
      return Response.json({ error: "Contrato, item, OS, período e semana são obrigatórios." }, { status: 400 });
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      return Response.json({ error: "Informe uma quantidade igual ou maior que zero." }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db
      .select()
      .from(executions)
      .where(and(
        eq(executions.contract, contract),
        eq(executions.item, item),
        eq(executions.serviceOrder, serviceOrder),
        eq(executions.period, period),
        eq(executions.week, week),
      ))
      .limit(1);

    const current = existing[0];
    if (isClosedPeriod(period)) {
      return Response.json({ error: "Período fechado: lançamentos de meses encerrados não podem ser alterados." }, { status: 409 });
    }
    if (action === "unlock") {
      if (!current) return Response.json({ error: "Lançamento não encontrado." }, { status: 404 });
      const now = new Date().toISOString();
      await db.batch([
        db.update(executions).set({ isLocked: false, lockedBy: null, lockedAt: null, updatedBy: user.email, updatedAt: now }).where(eq(executions.id, current.id)),
        db.insert(executionHistory).values({ executionId: current.id, contract, item, serviceOrder, period, week, action: "unlock", previousQuantity: current.quantity, quantity: current.quantity, changedBy: user.email, changedAt: now }),
      ]);
      return Response.json({ quantity: current.quantity, isLocked: false, updatedBy: user.email });
    }
    if (current?.isLocked) {
      return Response.json({ error: "Este lançamento está cravado. Clique em Editar para reabri-lo." }, { status: 409 });
    }

    const now = new Date().toISOString();
    if (current) {
      await db.batch([
        db.update(executions).set({ quantity, isLocked: action === "lock", lockedBy: action === "lock" ? user.email : null, lockedAt: action === "lock" ? now : null, updatedBy: user.email, updatedAt: now }).where(eq(executions.id, current.id)),
        db.insert(executionHistory).values({ executionId: current.id, contract, item, serviceOrder, period, week, action, previousQuantity: current.quantity, quantity, changedBy: user.email, changedAt: now }),
      ]);
    } else {
      const inserted = await db.insert(executions).values({ contract, item, serviceOrder, period, week, quantity, isLocked: action === "lock", lockedBy: action === "lock" ? user.email : null, lockedAt: action === "lock" ? now : null, updatedBy: user.email, updatedAt: now }).returning({ id: executions.id });
      await db.insert(executionHistory).values({ executionId: inserted[0]?.id, contract, item, serviceOrder, period, week, action, previousQuantity: null, quantity, changedBy: user.email, changedAt: now });
    }

    return Response.json({ quantity, isLocked: action === "lock", updatedBy: user.email });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar o lançamento." },
      { status: 500 },
    );
  }
}
