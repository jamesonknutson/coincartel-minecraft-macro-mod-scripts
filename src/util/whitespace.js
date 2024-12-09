/**
 * Gets the leading Whitespace component of a String.
 * @param {string} string
 * @returns {string}
 */
const getWhitespace = string => {
    return string.replace(/\t/g, '    ').match(/^\s*/)[0];
};

/**
 * Counts the length of the leading Whitespace component of a String.
 * @param {string} string
 * @returns {number}
 */
const getWhitespaceCount = string => {
    return getWhitespace(string).length;
};

/**
 * Reindents a String based off a base indentation level.
 * @param {string} string - The String to reindent.
 * @param {number} baseIndentLevel - The Base Indentation Level (returned from getWhitespaceCount).
 * @param {string} [character='    '] - The character to use for Indentation.
 * @returns {string}
 */
const reindentString = (string, baseIndentLevel, character='    ') => {
    string = string.replace(/\t/g, '    ');
    const whitespace = getWhitespaceCount(string);
    const baseDiff    = whitespace - baseIndentLevel;
    const indentLvl   = Math.floor(baseDiff / character.length);
    //console.log(`baseIndentLevel: ${baseIndentLevel}, ws chars: ${whitespace}, baseDiff: ${baseDiff}, indentLvl: ${indentLvl}`);
    if (indentLvl > 0) {
        return character.repeat(indentLvl) + string.trim();
    }
    return string.trim();
}

module.exports = { getWhitespace, getWhitespaceCount, reindentString };