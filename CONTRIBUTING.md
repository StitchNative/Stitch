# Contributing to Stitch

Stitch maintains high engineering standards to ensure the engine remains predictable, performant, and maintainable. All contributors must adhere to these guidelines.

## Technical Writing Standards

All project communications—including documentation, code comments, and commit messages—must use **Objective Technical Language**. Precision is prioritized; avoid casual, subjective, or hyperbolic terminology.

### 1. Style Guidelines
- **Eliminate Hyperbole:** Avoid words such as "fast", "blazing", "amazing", or "awesome". Instead, describe the technical mechanism (e.g., "O(1) lookup", "minimized I/O").
- **Remove Subjectivity:** Avoid qualifiers like "basically", "actually", "just", "simple", or "easy". 
- **Use Literal Terms:** Prefer descriptions of physical or mathematical reality (e.g., "SMI-optimized", "bit-packed", "zero-allocation").

### 2. Documentation Rules
- **Rationale Over Action:** Comments must clarify *why* a decision was made. The code itself should clearly express *what* is happening.

## Engineering Standards

### 1. Performance & Memory
- **Zero Allocations:** Avoid object/array creation and string concatenation in render/diff cycles.
- **TypedArrays:** Utilize `Uint32Array` or `Int32Array` for all grid and memory-intensive data.
- **Monomorphic Logic:** Maintain consistent object shapes to optimize V8 hidden class transitions.

### 2. Mathematical Integrity
- **Strict Integer Math:** Coerce all layout and rendering calculations to 32-bit integers using bitwise OR (`| 0`).
  ```javascript
  const offset = (total >> 1) | 0;
  ```

## Commit Message Protocol

Commit messages are a permanent technical record. They must follow the three-part structure and adhere strictly to the **Technical Writing Standards** (no casual language, hyperbole, or filler sentences).

### Required Format:
```text
type(scope): concise summary (imperative mood)

CHANGES:
- Technical list of modifications.

RATIONALE:
- Mathematical or architectural reason for the change.
- Comparison of previous vs. new state.

IMPROVEMENTS:
- Specific gains in performance, reliability, or stability.
- Quantifiable metrics (e.g., "reduced memory footprint by 40%").
```

### Commit Types:
- `feat`: A new capability.
- `fix`: A bug fix.
- `docs`: Documentation updates.
- `perf`: Performance optimizations.
- `refactor`: Structural changes without behavioral updates.
- `test`: Adding or correcting tests.
- `chore`: Maintenance tasks or dependency updates.

### Mandatory Scopes:
`core`, `vram`, `driver`, `layout`, `kernel`, `build`, `repo`.

## Pull Request Process

1. Fork the repository and create a branch from `main`.
2. Ensure the code adheres to all standards.
3. Verify all tests pass: `npm test`.
4. Submit your PR with a detailed technical description.
