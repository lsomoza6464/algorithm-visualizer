import axios from 'axios';

/**
 * Fetches LeetCode problem data for a given titleSlug.
 * @param {string} titleSlug - The slug of the LeetCode problem (e.g., 'two-sum').
 * @returns {Promise<{title: string, exampleTestcases: string[], starterCode: string, content: string}>}
 */
export async function fetchLeetCodeData(titleSlug = 'two-sum') {
  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        questionId
        exampleTestcases
        codeSnippets {
          lang
          langSlug
          code
        }
        content
      }
    }
  `;

  const variables = { titleSlug };

  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          Referer: `https://leetcode.com/problems/${titleSlug}/`,
        },
      }
    );

    const q = response.data.data.question;
    const jsSnippet = q.codeSnippets.find(snippet => snippet.langSlug === 'javascript');
    return {
      title: q.title,
      exampleTestcases: q.exampleTestcases ? q.exampleTestcases.split('\n') : [],
      starterCode: jsSnippet ? jsSnippet.code : '',
      content: q.content
    };
  } catch (err) {
    throw new Error(err.response?.data || err.message);
  }
}