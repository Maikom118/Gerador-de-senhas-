const MIN_TAMANHO = 8;
const PADROES_SEQUENCIAIS = ["1234", "abcd", "qwerty", "senha", "password"];
const SENHAS_COMUNS = new Set(["123456", "password", "admin", "qwerty", "12345678"]);

const CARACTERES = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
};

const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("lengthValue");
const symbolsInput = document.getElementById("symbols");
const generateBtn = document.getElementById("generateBtn");
const generatedPassword = document.getElementById("generatedPassword");
const copyBtn = document.getElementById("copyBtn");
const copyStatus = document.getElementById("copyStatus");
const useInEvaluatorBtn = document.getElementById("useInEvaluatorBtn");
const themeToggle = document.getElementById("themeToggle");

const passwordInput = document.getElementById("passwordInput");
const strengthChip = document.getElementById("strengthChip");
const meterFill = document.getElementById("meterFill");
const feedbackList = document.getElementById("feedbackList");

const TEMA_STORAGE_KEY = "password-lab-theme";

function definirTextoToggle(tema) {
  if (!themeToggle) {
    return;
  }

  themeToggle.textContent = tema === "dark" ? "Tema claro" : "Tema escuro";
}

function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  definirTextoToggle(tema);
}

function temaInicial() {
  const salvo = localStorage.getItem(TEMA_STORAGE_KEY);
  if (salvo === "dark" || salvo === "light") {
    return salvo;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function alternarTema() {
  const atual = document.documentElement.getAttribute("data-theme") || "light";
  const proximo = atual === "dark" ? "light" : "dark";
  aplicarTema(proximo);
  localStorage.setItem(TEMA_STORAGE_KEY, proximo);
}

function randomInt(maxExclusive) {
  if (maxExclusive <= 0) {
    return 0;
  }

  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  return rand[0] % maxExclusive;
}

function pickRandom(source) {
  return source[randomInt(source.length)];
}

function shuffle(chars) {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars;
}

function gerarSenha(tamanho = 16, usarSimbolos = true) {
  if (tamanho < MIN_TAMANHO) {
    throw new Error(`O tamanho minimo e ${MIN_TAMANHO} caracteres.`);
  }

  const grupos = [CARACTERES.upper, CARACTERES.lower, CARACTERES.digits];
  if (usarSimbolos) {
    grupos.push(CARACTERES.symbols);
  }

  const senhaChars = grupos.map((grupo) => pickRandom(grupo));
  const todosCaracteres = grupos.join("");

  for (let i = senhaChars.length; i < tamanho; i += 1) {
    senhaChars.push(pickRandom(todosCaracteres));
  }

  return shuffle(senhaChars).join("");
}

function avaliarSenha(senha) {
  if (!senha) {
    return {
      nivel: "FRACA",
      feedback: ["Digite uma senha para avaliar."],
      score: 0,
      maxScore: 8
    };
  }

  if (SENHAS_COMUNS.has(senha.toLowerCase())) {
    return {
      nivel: "MUITO FRACA",
      feedback: ["Senha extremamente comum. Escolha outra."],
      score: 0,
      maxScore: 8
    };
  }

  let score = 0;
  const feedback = [];

  if (senha.length >= 16) {
    score += 3;
  } else if (senha.length >= 12) {
    score += 2;
  } else if (senha.length >= MIN_TAMANHO) {
    score += 1;
  } else {
    feedback.push(`Use pelo menos ${MIN_TAMANHO} caracteres.`);
  }

  if (/[A-Z]/.test(senha)) {
    score += 1;
  } else {
    feedback.push("Adicione letras maiusculas.");
  }

  if (/[a-z]/.test(senha)) {
    score += 1;
  } else {
    feedback.push("Adicione letras minusculas.");
  }

  if (/[0-9]/.test(senha)) {
    score += 1;
  } else {
    feedback.push("Adicione numeros.");
  }

  const simbolosRegex = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
  if (simbolosRegex.test(senha)) {
    score += 1;
  } else {
    feedback.push("Adicione caracteres especiais.");
  }

  if (/(.)\1\1/.test(senha)) {
    score -= 1;
    feedback.push("Evite repeticoes de caracteres (ex: aaa, 111).");
  }

  const senhaLower = senha.toLowerCase();
  if (PADROES_SEQUENCIAIS.some((padrao) => senhaLower.includes(padrao))) {
    score -= 1;
    feedback.push("Evite sequencias previsiveis (ex: 1234, abcd, qwerty).");
  }

  score = Math.max(score, 0);

  let nivel = "FRACA";
  if (score <= 2) {
    nivel = "FRACA";
  } else if (score <= 4) {
    nivel = "MEDIA";
  } else if (score <= 6) {
    nivel = "FORTE";
  } else {
    nivel = "MUITO FORTE";
  }

  return { nivel, feedback, score, maxScore: 8 };
}

function atualizarMedidor(score, maxScore) {
  const percentual = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
  meterFill.style.width = `${percentual}%`;

  if (score <= 2) {
    meterFill.style.backgroundColor = "#d64545";
  } else if (score <= 4) {
    meterFill.style.backgroundColor = "#e6a626";
  } else if (score <= 6) {
    meterFill.style.backgroundColor = "#1f8a70";
  } else {
    meterFill.style.backgroundColor = "#0f766e";
  }
}

function atualizarChip(nivel) {
  strengthChip.textContent = nivel;
  strengthChip.className = "chip";

  if (nivel === "FRACA" || nivel === "MUITO FRACA") {
    strengthChip.classList.add("bad");
  } else if (nivel === "MEDIA") {
    strengthChip.classList.add("mid");
  } else if (nivel === "FORTE") {
    strengthChip.classList.add("ok");
  } else {
    strengthChip.classList.add("great");
  }
}

function renderFeedback(items) {
  feedbackList.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Senha bem segura!";
    feedbackList.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    feedbackList.appendChild(li);
  });
}

function processarAvaliacao() {
  const resultado = avaliarSenha(passwordInput.value.trim());
  atualizarChip(resultado.nivel);
  atualizarMedidor(resultado.score, resultado.maxScore);
  renderFeedback(resultado.feedback);
}

function enviarSenhaParaAvaliador() {
  const senha = generatedPassword.value.trim();
  if (!senha) {
    copyStatus.textContent = "Digite ou gere uma senha antes de enviar para o avaliador.";
    return;
  }

  passwordInput.value = senha;
  processarAvaliacao();
  copyStatus.textContent = "Senha enviada para o avaliador.";
}

lengthInput.addEventListener("input", () => {
  lengthValue.textContent = lengthInput.value;
});

generateBtn.addEventListener("click", () => {
  copyStatus.textContent = "";

  try {
    const senha = gerarSenha(Number(lengthInput.value), symbolsInput.checked);
    generatedPassword.value = senha;
  } catch (err) {
    generatedPassword.value = "";
    copyStatus.textContent = err.message;
  }
});

copyBtn.addEventListener("click", async () => {
  const senha = generatedPassword.value.trim();
  if (!senha) {
    copyStatus.textContent = "Digite ou gere uma senha antes de copiar.";
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(senha);
    } else {
      generatedPassword.select();
      document.execCommand("copy");
    }

    copyStatus.textContent = "Senha copiada!";
  } catch (_error) {
    copyStatus.textContent = "Nao foi possivel copiar automaticamente.";
  }
});

generatedPassword.addEventListener("input", () => {
  if (generatedPassword.value.trim()) {
    copyStatus.textContent = "";
  }
});

useInEvaluatorBtn.addEventListener("click", enviarSenhaParaAvaliador);
if (themeToggle) {
  themeToggle.addEventListener("click", alternarTema);
}

passwordInput.addEventListener("input", () => {
  if (!passwordInput.value.trim()) {
    strengthChip.textContent = "Aguardando";
    strengthChip.className = "chip neutral";
    meterFill.style.width = "0";
    feedbackList.innerHTML = "";
    return;
  }

  processarAvaliacao();
});

lengthValue.textContent = lengthInput.value;
aplicarTema(temaInicial());
