now we need to fix icons

1. currently, we use full iconify json so it has complete icon collection
2. so remove that and install iconify lucide icons only and replace all the icons in the project with lucide icons.
3. for accounts we use the iconify api so they will fallback to api only to fetch and its managed automatically no problem.
4. so these app icons will placed in build time and will be bundled with the app, so no need to fetch them from the API at runtime.
5. also improve the search and filtering of icons in the icon picker to make it easier to find the right icon in account add and edit.
6. also check the the select input where we search issuer the width is not matching with the other inputs, so make sure to fix that as well.

and ask me if you have any doubts or need clarification on any of the points above.
