export default [
    {
        "type": "basic-operations",
        "name": "exponentiation",
        "expression": "x^y"
    },
    {
        "type": "basic-operations",
        "name": "subscript",
        "expression": "x_0"
    },
    {
        "type": "basic-operations",
        "name": "fraction",
        "expression": "\\frac{a + b}{a \\cdot b}"
    },
    {
        "type": "basic-operations",
        "name": "square-root",
        "expression": "\\sqrt{x}"
    },
    {
        "type": "basic-operations",
        "name": "nth-root",
        "expression": "\\sqrt[n]{x}"
    },
    {
        "type": "trigonometric-functions",
        "name": "sine",
        "expression": "\\sin(x)"
    },
    {
        "type": "trigonometric-functions",
        "name": "cosine",
        "expression": "\\cos(x)"
    },
    {
        "type": "trigonometric-functions",
        "name": "tangent",
        "expression": "\\tan(x)"
    },
    {
        "type": "logarithmic-functions",
        "name": "natural-logarithm",
        "expression": "\\ln(x)"
    },
    {
        "type": "logarithmic-functions",
        "name": "logarithm-base-b",
        "expression": "\\log_{b}(x)"
    },
    {
        "type": "summations-and-limits",
        "name": "summation",
        "expression": "\\sum_{i=1}^n i"
    },
    {
        "type": "summations-and-limits",
        "name": "limit",
        "expression": "\\lim_{x \\to \\infty}"
    },
    {
        "type": "calculus",
        "name": "definite-integral",
        "expression": "\\int_{a}^{b} f(x)dx"
    },
    {
        "type": "calculus",
        "name": "partial-derivative",
        "expression": "\\partial_x f(x)"
    },
    {
        "type": "calculus",
        "name": "divergence",
        "expression": "\\nabla \\cdot \\vec{F}"
    },
    {
        "type": "matrices-and-vectors",
        "name": "matrix",
        "expression": "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}"
    },
    {
        "type": "matrices-and-vectors",
        "name": "identity-matrix",
        "expression": "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}"
    },
    {
        "type": "matrices-and-vectors",
        "name": "vector",
        "expression": "\\vec{v} = \\begin{bmatrix} x \\\\ y \\end{bmatrix}"
    },
    {
        "type": "matrices-and-vectors",
        "name": "cases",
        "expression": "\\begin{cases} a & \\text{if } b \\\\ c & \\text{if } d \\end{cases}"
    },
    {
        "type": "symbols",
        "name": "infinity",
        "expression": "\\infty"
    },
    {
        "type": "symbols",
        "name": "union",
        "expression": "\\cup"
    },
    {
        "type": "symbols",
        "name": "intersection",
        "expression": "\\cap"
    },
    {
        "type": "symbols",
        "name": "not-equal",
        "expression": "\\neq"
    },
    {
        "type": "symbols",
        "name": "approximately-equal",
        "expression": "\\approx"
    },
    {
        "type": "symbols",
        "name": "element-of",
        "expression": "\\in"
    },
    {
        "type": "symbols",
        "name": "not-an-element-of",
        "expression": "\\notin"
    },
    {
        "type": "symbols",
        "name": "subset",
        "expression": "\\subset"
    },
    {
        "type": "symbols",
        "name": "subset-or-equal",
        "expression": "\\subseteq"
    },
    {
        "type": "symbols",
        "name": "superset",
        "expression": "\\supset"
    },
    {
        "type": "symbols",
        "name": "superset-or-equal",
        "expression": "\\supseteq"
    },
    {
        "type": "symbols",
        "name": "for-all",
        "expression": "\\forall"
    },
    {
        "type": "symbols",
        "name": "exists",
        "expression": "\\exists"
    },
    {
        "type": "symbols",
        "name": "plus-or-minus",
        "expression": "\\pm",
    },
    {
        "type": "lines-and-decorations",
        "name": "overline",
        "expression": "\\overline{abc}"
    },
    {
        "type": "lines-and-decorations",
        "name": "underline",
        "expression": "\\underline{abc}"
    },
    {
        "type": "lines-and-decorations",
        "name": "hat",
        "expression": "\\widehat{abc}"
    },
    {
        "type": "lines-and-decorations",
        "name": "tilde",
        "expression": "\\tilde{abc}"
    },
    {
        "type": "greek-letters",
        "name": "alpha",
        "expression": "\\alpha"
    },
    {
        "type": "greek-letters",
        "name": "beta",
        "expression": "\\beta"
    },
    {
        "type": "greek-letters",
        "name": "gamma",
        "expression": "\\gamma"
    },
    {
        "type": "greek-letters",
        "name": "delta",
        "expression": "\\Delta"
    },
    {
        "type": "greek-letters",
        "name": "theta",
        "expression": "\\theta"
    },
    {
        "type": "greek-letters",
        "name": "lambda",
        "expression": "\\lambda"
    },
    {
        "type": "greek-letters",
        "name": "mu",
        "expression": "\\mu"
    },
    {
        "type": "greek-letters",
        "name": "pi",
        "expression": "\\pi"
    },
    {
        "type": "greek-letters",
        "name": "rho",
        "expression": "\\rho"
    },
    {
        "type": "greek-letters",
        "name": "sigma",
        "expression": "\\sigma"
    },
    {
        "type": "greek-letters",
        "name": "phi",
        "expression": "\\phi"
    },
    {
        "type": "greek-letters",
        "name": "omega",
        "expression": "\\omega"
    },
    {
        "type": "common-formulas",
        "name": "quadratic-formula",
        "expression": "y = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
    },
    {
        "type": "common-formulas",
        "name": "area-of-a-circle",
        "expression": "A = \\pi r^2"
    },
    {
        "type": "common-formulas",
        "name": "binomial-theorem",
        "expression": "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k"
    },
    {
        "type": "common-formulas",
        "name": "pythagorean-identity",
        "expression": "\\sin^2(\\theta) + \\cos^2(\\theta) = 1"
    },
    {
        "type": "common-formulas",
        "name": "coulombs-law",
        "expression": "F = k_e \\frac{q_1 q_2}{r^2}"
    },
    {
        "type": "common-formulas",
        "name": "bayes-theorem",
        "expression": "P(A|B) = \\frac{P(B|A)P(A)}{P(B)}"
    },
    {
        "type": "common-formulas",
        "name": "derivative",
        "expression": "\\frac{d}{dx} f(x)"
    },
    {
        "type": "common-formulas",
        "name": "double-integral",
        "expression": "\\iint_{D} f(x, y) \\, dx \\, dy"
    },
    {
        "type": "common-formulas",
        "name": "triple-integral",
        "expression": "\\iiint_{V} f(x, y, z) \\, dx \\, dy \\, dz"
    },
];
