export type LanguageId = 'javascript' | 'python' | 'java'

export const LANGUAGE_ID_MAP: Record<LanguageId, number> = {
    javascript: 63,
    python: 71,
    java: 62
}

export type RunOutcome = 'accepted' | 'wrong-answer' | 'error'

export type CaseResult = {
    index: number
    input: string
    expectedOutput: string
    actualOutput: string
    stderr: string
    status: { id: number; description: string }
    outcome: RunOutcome
    timeSec: number | null
    memoryKb: number | null
}

export type ProblemTestCase = { input: string; output: string }

type CodeBoxResponse = {
    stdout: string | null
    stderr: string | null
    status: { id: number; description: string }
}

export async function executeOnCodeBox(params:{
    languageId: number
    sourceCode: string
    stdin: string
    expectedOutput: string
}) {
    const token = process.env.CODEBOX_API_TOKEN

    if (!token) throw new Error('CODEBOX_TOKEN is not configured on the server.')

    const upstream = await fetch('https://chaicode.net/api/execute', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': token,
        },
        body:JSON.stringify({
            Language_id: params.languageId,
            source_code: params.sourceCode,
            stdin: params.stdin,
            expected_output: params.expectedOutput,
            cpu_time_limit: 5,
            memory_limit: 256000,
        })
    })

    const text = await upstream.text();

    if (!upstream.ok) throw new Error(`CodeBox ${upstream.status}: ${text}`)
        return JSON.parse(text) as CodeBoxResponse
}

export function parseTestCases(raw: unknown): ProblemTestCase[] {
    return Array.isArray(raw) ? (raw as ProblemTestCase[]) : []
}

export async function RunAllTestCases(params:{
    language: LanguageId,
    sourceCode: string,
    testCases: ProblemTestCase[]
}) {
    const languageId = LANGUAGE_ID_MAP[params.language];
    
    return Promise.all(
        params.testCases.map(async(testCase, index) => {
            try {
                const data = await executeOnCodeBox({
                    languageId,
                    sourceCode: params.sourceCode,
                    stdin:testCase.input,
                    expectedOutput:testCase.output
                })
            } catch (error) {
                
            }
        })
    )
}