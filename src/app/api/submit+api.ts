import { parseTestCases, RunAllTestCases } from "@/lib/judge";
import { runTaskAsync } from "@/lib/run-task";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/supabase-admin";
import { StatusError } from "expo-server";

export async function POST(request: Request) {
    const user = getUserFromRequest(request)

    if (!user) throw new StatusError(401, "Unauthorized");

    const { problemId, language, sourceCode } = await request.json();

    if (!problemId || !sourceCode) {
        throw new StatusError(400, '`problemId` and `sourceCode` are required.')
    }

    const admin = getSupabaseAdmin();
    const {data: problem} = await admin.from("problems")
    .select('id, test_cases')
    .eq('id', problemId)
    .maybeSingle();

    if (!problem) throw new StatusError(404, "Problem not found")

    const testCases = parseTestCases(problem.test_cases);

    if (!testCases.length) throw new StatusError(400, "No test cases configured.")

    const result = await runTaskAsync(() => RunAllTestCases({
        language,
        sourceCode, 
        testCases
    }))
}