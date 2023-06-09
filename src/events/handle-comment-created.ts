import { Context } from 'probot';
import { sendToGpt } from '../services/gpt-service';

export default async (context: Context): Promise<void> => {
    console.log('GOT INTO ISSUE EVENT')
    const octokit = context.octokit;

    console.log(JSON.stringify(context.payload, null, 2));

    // Check if the bot is mentioned in the comment and if the comment is on a pull request
    // @ts-ignore
    const commentBody = context.payload.comment.body;
    const isBotMentioned = commentBody.includes('@probot-gpt-reviewer');
    // @ts-ignore
    const isPullRequest = 'pull_request' in context.payload.issue;

    if (isBotMentioned && isPullRequest) {
        const repo = context.repo();
        // @ts-ignore
        const pullRequestNumber = context.payload.issue.number;

        // Get the pull request details
        const pullRequestResponse = await octokit.pulls.get({
            ...repo,
            pull_number: pullRequestNumber,
        });

        const pullRequest = pullRequestResponse.data;
        const title = pullRequest.title;
        const description = pullRequest.body;

        const messages = [
            { role: 'system', content: 'You are a helpful AI that reviews code and being questioned about previous comments' },
            { role: 'user', content: `Pull Request Title: ${title}` },
            { role: 'user', content: `Pull Request Description: ${description}` },
        ];

        // Fetch all the comments on the pull request
        const comments = await octokit.issues.listComments({
            ...repo,
            issue_number: pullRequestNumber,
        });

        // Process each comment (or do something else)
        for (const comment of comments.data) {
            messages.push({ role: 'user', content: `Comment: ${comment.body}` });
            console.log(comment.body);
        }

        // Get the question in the comment where the bot was mentioned
        const question = commentBody.split('@probot-gpt-reviewer')[1].trim(); // get the text after the bot's name
        messages.push({ role: 'user', content: `Question: ${question}` });
        console.log(question);

        const gptResponse = await sendToGpt(messages);

        // Create a comment on the pull request
        await octokit.issues.createComment({
            ...repo,
            issue_number: pullRequest.number,
            body: gptResponse,
        });
    }
}
