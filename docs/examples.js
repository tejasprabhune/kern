export const GALLERY = [
  // Classics.
  {
    name: 'Quadratic formula',
    src: 'x = frac(-b plus.minus sqrt(b^2 - 4 a c), 2 a)',
  },
  {
    name: "Euler's identity",
    src: 'e^(i pi) + 1 = 0',
  },
  {
    name: 'Pythagorean theorem',
    src: 'a^2 + b^2 = c^2',
  },
  {
    name: 'Golden ratio',
    src: 'phi = frac(1 + sqrt(5), 2)',
  },

  // Calculus.
  {
    name: 'Fundamental theorem of calculus',
    src: 'integral_a^b f\'(x) d x = f(b) - f(a)',
  },
  {
    name: 'Taylor series',
    src: 'f(x) = sum_(n=0)^infinity frac(f^((n))(a), n!) (x - a)^n',
  },
  {
    name: 'Fourier transform',
    src: 'hat(f)(xi) = integral_(-infinity)^infinity f(x) e^(-2 pi i x xi) d x',
  },
  {
    name: 'Stokes theorem',
    src: 'integral_M d omega = integral_(partial M) omega',
  },

  // Linear algebra.
  {
    name: 'Identity matrix',
    src: 'I_3 = mat(1, 0, 0; 0, 1, 0; 0, 0, 1)',
  },
  {
    name: 'Eigenvalue equation',
    src: 'A bold(v) = lambda bold(v)',
  },
  {
    name: 'Determinant (2x2)',
    src: 'det vmat(a, b; c, d) = a d - b c',
  },
  {
    name: 'Singular value decomposition',
    src: 'A = U Sigma V^*',
  },

  // Probability and statistics.
  {
    name: 'Bayes rule',
    src: 'P(A | B) = frac(P(B | A) P(A), P(B))',
  },
  {
    name: 'Normal distribution',
    src: 'p(x) = frac(1, sigma sqrt(2 pi)) e^(- frac((x - mu)^2, 2 sigma^2))',
  },
  {
    name: 'Expectation',
    src: 'EE[X] = integral_(-infinity)^infinity x p(x) d x',
  },
  {
    name: 'Cross entropy',
    src: 'H(p, q) = - sum_x p(x) log q(x)',
  },
  {
    name: 'KL divergence',
    src: 'D_("KL")(p || q) = sum_x p(x) log frac(p(x), q(x))',
  },
  {
    name: 'Central limit theorem',
    src: 'frac(1, sqrt(n)) sum_(i=1)^n (X_i - mu) -> cal(N)(0, sigma^2)',
  },

  // Physics.
  {
    name: "Schrodinger equation",
    src: 'i hbar frac(partial, partial t) Psi(bold(r), t) = hat(H) Psi(bold(r), t)',
  },
  {
    name: 'Maxwell, Gauss',
    src: 'nabla dot.op bold(E) = frac(rho, epsilon_0)',
  },
  {
    name: 'Maxwell, Faraday',
    src: 'nabla times bold(E) = - frac(partial bold(B), partial t)',
  },
  {
    name: 'Mass-energy equivalence',
    src: 'E^2 = (m c^2)^2 + (p c)^2',
  },
  {
    name: 'Path integral',
    src: 'angle.l q_f | e^(- i H T \\/ hbar) | q_i angle.r = integral cal(D)[q(t)] e^(i S[q] \\/ hbar)',
  },
  {
    name: 'Einstein field equations',
    src: 'R_(mu nu) - frac(1, 2) g_(mu nu) R + Lambda g_(mu nu) = frac(8 pi G, c^4) T_(mu nu)',
  },

  // Machine learning.
  {
    name: 'Softmax',
    src: 'sigma(z)_i = frac(e^(z_i), sum_(j=1)^K e^(z_j))',
  },
  {
    name: 'Attention',
    src: '"Attention"(Q, K, V) = "softmax"(frac(Q K^T, sqrt(d_k))) V',
  },
  {
    name: 'PPO clipped objective',
    src: 'L^"CLIP"(theta) = EE_t [min(r_t(theta) hat(A)_t, "clip"(r_t(theta), 1 - epsilon, 1 + epsilon) hat(A)_t)]',
  },
  {
    name: 'Conditional flow matching',
    src: 'L_"CFM"(theta) = EE_(t, x_1, x_t) norm(v_theta(x_t, t) - u_t(x_t | x_1))^2',
  },
  {
    name: 'Bellman optimality',
    src: 'V^*(s) = max_a [r(s, a) + gamma sum_(s\') P(s\' | s, a) V^*(s\')]',
  },
  {
    name: 'ELBO',
    src: 'cal(L)(theta, phi; x) = EE_(q_phi(z | x)) [log p_theta(x | z)] - D_("KL")(q_phi(z | x) || p(z))',
  },

  // Number theory and combinatorics.
  {
    name: 'Binomial theorem',
    src: 'sum_(k=0)^n binom(n, k) x^k y^(n-k) = (x + y)^n',
  },
  {
    name: 'Sum of integers',
    src: 'sum_(i=1)^n i = frac(n(n+1), 2)',
  },
  {
    name: 'Basel problem',
    src: 'sum_(n=1)^infinity frac(1, n^2) = frac(pi^2, 6)',
  },
  {
    name: 'Cases',
    src: 'sgn(x) = cases(1 "if" x > 0, 0 "if" x = 0, -1 "if" x < 0)',
  },

  // Multi-line equations.
  {
    name: 'Completing the square',
    src: 'a x^2 + b x + c &= a (x^2 + b/a x) + c \\ &= a (x + b/(2 a))^2 + c - b^2/(4 a)',
  },
  {
    name: 'Binomial expansion',
    src: '(a + b)^2 &= (a + b)(a + b) \\ &= a^2 + 2 a b + b^2',
  },
  {
    name: 'Geometric series',
    src: 'S_n &= 1 + r + r^2 + dots + r^(n-1) \\ r S_n &= r + r^2 + dots + r^n \\ (1 - r) S_n &= 1 - r^n',
  },
  {
    name: 'Augmented matrix',
    src: 'mat(1, 2, 3; 4, 5, 6; 7, 8, 9, augment: 2)',
  },

  // Style showcases.
  {
    name: 'Style functions',
    src: 'cal(F) + bb(R) + frak(g) + bold(v)',
  },
  {
    name: 'Greek alphabet',
    src: 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu',
  },
];
