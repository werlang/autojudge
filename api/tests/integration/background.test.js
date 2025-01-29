import MysqlConnector from './mysqlConnector.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import User from './model/user.js';
import Contest from './model/contest.js';
import Team from './model/team.js';
import Problem from './model/problem.js';
import Submission from './model/submission.js';

jest.mock('jsonwebtoken');

describe('Backround Tasks', () => {
    let userData;
    let contestData;
    let problemData;
    let teamData;
    let submissionData;
    let connector;
    let sqlFile = fs.readFileSync('tests/integration/database-test.sql', 'utf8');
    
    const passTime = time => jest.setSystemTime(new Date(Date.now() + time));

    beforeAll(async () => {
        userData = {
            name: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: 'password',
        };

        contestData = {
            name: 'Contest 1',
            description: 'Description',
            duration: 180,
            penaltyTime: 20,
            freezeTime: 15,
        };

        problemData = {
            title: 'Test problem',
            description: 'This is a test problem',
            input: ['1 2', '3 4'],
            output: ['3', '7'],
            inputHidden: ['1 2', '3 4'],
            outputHidden: ['3', '7'],
        };

        teamData = {
            id: 1,
            name: 'Team 1',
            password: 'password',
        };

        submissionData = {
            id: 1,
            filename: 'hello.c',
            code: Buffer.from('foo').toString('base64'),
        };

        jest.spyOn(bcrypt, 'compare');
    });

    beforeEach(async () => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] })

        connector = await new MysqlConnector({ sqlFile }).bootstrap();

        jwt.sign.mockReturnValue('valid_token');
        bcrypt.compare.mockImplementation(() => true);
    });
    
    afterEach(async () => {
        jest.useRealTimers();

        jest.clearAllMocks();
        await connector.destroy();
    });

    afterAll(async () => {
        // await MysqlConnector.destroyAll();
    });

    async function addSubmission(data={}) {
        const elapsedTime = 1000;
        jwt.verify.mockImplementation(() => ({ user: userData.email }));
        await new User(userData).insert();
        const contest = await new Contest(contestData).insert();
        const problem = await new Problem(problemData).insert();
        await problem.update({
            inputHidden: problemData.inputHidden,
            outputHidden: problemData.outputHidden,
        });
        await contest.addProblem(problem.id);
        
        const team = await new Team({ ...teamData, contest }).insert();
        await contest.start();
        await contest.get();

        // use mysqlconnector to make contest start_time be in the past
        await connector.query(`UPDATE contests SET start_time = ? WHERE id = ?`, [
            new Date(new Date(contest.startTime).getTime() - elapsedTime),
            contest.id
        ]);

        passTime(elapsedTime);

        await contest.get();

        jwt.verify.mockImplementation(() => ({ team: team.id }));
        const submission = await new Submission({ ...submissionData, problem, ...data }).insert();

        return {team, contest, problem, submission};
    }

    test.each([
        ['C', 'c', '#include <stdio.h>\nint main(){ int a, b; scanf("%d %d", &a, &b); printf("%d ", a + b); return 0; }'],
        ['C++', 'cpp', '#include <iostream>\nint main(){ int a, b; std::cin >> a >> b; std::cout << a + b; return 0; }'],
        ['Python', 'py', 'a, b = map(int, input().split()); print(a + b)'],
        ['Javascript', 'js', 'const [a, b] = require("fs").readFileSync(0, "utf8").split(" ").map(Number); console.log(a + b);'],
        ['PHP', 'php', '<?php [$a, $b] = explode(" ", trim(fgets(STDIN))); echo $a + $b;'],
        ['Java', 'java', 'import java.util.Scanner;\npublic class Main { public static void main(String[] args) { Scanner sc = new Scanner(System.in); int a = sc.nextInt(), b = sc.nextInt(); System.out.print(a + b); } }'],
    ])('should submit a correct solution in %s to be judged', async (language, extension, code) => {
        const {submission} = await addSubmission({
            filename: language === 'Java' ? 'Main.java' : `hello.${extension}`,
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.failed).toBe(0);
    });

    test('should submit a correct solution in an unsupported language', async () => {
        // language = pascal
        const code = 'begin readln(a, b); writeln(a + b); end.';
        const {submission} = await addSubmission({
            filename: 'hello.pas',
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.message).toBe(`Unsupported extension: pas`);
        expect(submission.run.error).toBe(true);
        expect(submission.run.status).toBe('PARSING_ERROR');
    });

    test('should handle invalid code', async () => {
        const {submission} = await addSubmission({
            filename: 'hello.c',
            code: 'invalid code',
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.passed).toBe(0);
        expect(submission.run.status).toBe('ERROR');
    });

    test('should handle invalid filename', async () => {
        const {submission} = await addSubmission({
            filename: 'invalid',
            code: Buffer.from('foo').toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.message).toBe(`Unsupported extension: `);
        expect(submission.run.error).toBe(true);
        expect(submission.run.status).toBe('PARSING_ERROR');
    });

    test('should handle code with time limit exceeded', async () => {
        const code = 'int main() { while(1); return 0; }';
        const {submission} = await addSubmission({
            filename: 'hello.c',
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.status).toBe('TIME_LIMIT_EXCEEDED');
        expect(submission.run.error).toBe(true);
    });

    test('should handle code with compilation error', async () => {
        const code = 'int main() { return 0s; }';
        const {submission} = await addSubmission({
            filename: 'hello.c',
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.status).toBe('ERROR');
        expect(submission.run.passed).toBe(0);
    });

    test('should handle code with runtime error', async () => {
        const code = 'int main() { int *p = NULL; *p = 0; return 0; }';
        const {submission} = await addSubmission({
            filename: 'hello.c',
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.status).toBe('ERROR');
        expect(submission.run.passed).toBe(0);
    });

    test('should handle code with wrong output', async () => {
        const code = '#include <stdio.h>\nint main() { printf("foo"); return 0; }';
        const {submission} = await addSubmission({
            filename: 'hello.c',
            code: Buffer.from(code).toString('base64'),
        });

        await submission.judge();
        // console.log(submission.run);

        expect(submission.run.status).toBe('WRONG_ANSWER');
        expect(submission.run.passed).toBe(0);
        expect(submission.run.results[0].expected).toBe('3');
        expect(submission.run.results[0].received).toBe('foo');
        expect(submission.run.results[1].expected).toBe('7');
        expect(submission.run.results[1].received).toBe('foo');
    });
});

// TODO: /judge endpoint after judge tests are done