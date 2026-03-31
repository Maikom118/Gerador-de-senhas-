import re
import secrets
import string
import argparse

MIN_TAMANHO = 8
PADROES_SEQUENCIAIS = ("1234", "abcd", "qwerty", "senha", "password")
SENHAS_COMUNS = {"123456", "password", "admin", "qwerty", "12345678"}


def gerar_senha(tamanho=16, usar_simbolos=True):
    if tamanho < MIN_TAMANHO:
        raise ValueError(f"O tamanho minimo e {MIN_TAMANHO} caracteres.")

    grupos = [string.ascii_uppercase, string.ascii_lowercase, string.digits]
    if usar_simbolos:
        grupos.append(string.punctuation)

    # Garante ao menos 1 caractere de cada grupo ativo.
    senha_chars = [secrets.choice(grupo) for grupo in grupos]
    todos_caracteres = "".join(grupos)

    for _ in range(tamanho - len(senha_chars)):
        senha_chars.append(secrets.choice(todos_caracteres))

    secrets.SystemRandom().shuffle(senha_chars)
    return "".join(senha_chars)


def avaliar_senha(senha):
    if not senha:
        return "FRACA", ["Digite uma senha para avaliar."]

    if senha.lower() in SENHAS_COMUNS:
        return "MUITO FRACA", ["Senha extremamente comum. Escolha outra."]

    score = 0
    feedback = []

    if len(senha) >= 16:
        score += 3
    elif len(senha) >= 12:
        score += 2
    elif len(senha) >= MIN_TAMANHO:
        score += 1
    else:
        feedback.append(f"Use pelo menos {MIN_TAMANHO} caracteres.")

    if re.search(r"[A-Z]", senha):
        score += 1
    else:
        feedback.append("Adicione letras maiúsculas.")

    if re.search(r"[a-z]", senha):
        score += 1
    else:
        feedback.append("Adicione letras minúsculas.")

    if re.search(r"[0-9]", senha):
        score += 1
    else:
        feedback.append("Adicione números.")

    if re.search(rf"[{re.escape(string.punctuation)}]", senha):
        score += 1
    else:
        feedback.append("Adicione caracteres especiais.")

    if re.search(r"(.)\1\1", senha):
        score -= 1
        feedback.append("Evite repeticoes de caracteres (ex: aaa, 111).")

    senha_lower = senha.lower()
    if any(padrao in senha_lower for padrao in PADROES_SEQUENCIAIS):
        score -= 1
        feedback.append("Evite sequencias previsiveis (ex: 1234, abcd, qwerty).")

    score = max(score, 0)

    if score <= 2:
        nivel = "FRACA"
    elif score <= 4:
        nivel = "MÉDIA"
    elif score <= 6:
        nivel = "FORTE"
    else:
        nivel = "MUITO FORTE"

    return nivel, feedback


def pedir_inteiro(mensagem, minimo=1, padrao=None):
    while True:
        entrada = input(mensagem).strip()
        if not entrada and padrao is not None:
            return padrao

        try:
            valor = int(entrada)
        except ValueError:
            print("Digite um numero inteiro valido.")
            continue

        if valor < minimo:
            print(f"Digite um valor maior ou igual a {minimo}.")
            continue

        return valor


def menu():
    while True:
        print("\n=== PASSWORD TOOL ===")
        print("1 - Gerar senha segura")
        print("2 - Avaliar senha")
        print("3 - Sair")

        opcao = input("Escolha: ").strip()

        if opcao == "1":
            tamanho = pedir_inteiro(
                f"Tamanho da senha (Enter para 16, minimo {MIN_TAMANHO}): ",
                minimo=MIN_TAMANHO,
                padrao=16,
            )
            usar_simbolos = input("Incluir simbolos? (s/n, padrao s): ").strip().lower()
            senha = gerar_senha(tamanho, usar_simbolos != "n")
            print(f"\nSenha gerada: {senha}")

        elif opcao == "2":
            senha = input("Digite a senha: ").strip()
            nivel, feedback = avaliar_senha(senha)

            print(f"\nForça da senha: {nivel}")

            if feedback:
                print("Melhorias:")
                for f in feedback:
                    print(f"- {f}")
            else:
                print("Senha bem segura!")

        elif opcao == "3":
            break
        else:
            print("Opção inválida.")


def construir_parser():
    parser = argparse.ArgumentParser(
        description="Ferramenta para gerar e avaliar senhas."
    )
    parser.add_argument(
        "-g",
        "--generate",
        action="store_true",
        help="Gera uma senha aleatória.",
    )
    parser.add_argument(
        "-l",
        "--length",
        type=int,
        default=16,
        help=f"Tamanho da senha gerada (padrão: 16, mínimo: {MIN_TAMANHO}).",
    )
    parser.add_argument(
        "--no-symbols",
        action="store_true",
        help="Gera senha sem símbolos.",
    )
    parser.add_argument(
        "-e",
        "--evaluate",
        type=str,
        help="Avalia a força da senha informada.",
    )
    return parser


def executar_cli(args):
    executou_alguma_acao = False

    if args.generate:
        try:
            senha = gerar_senha(args.length, usar_simbolos=not args.no_symbols)
        except ValueError as erro:
            print(f"Erro: {erro}")
            return 1

        print(f"Senha gerada: {senha}")
        executou_alguma_acao = True

    if args.evaluate is not None:
        nivel, feedback = avaliar_senha(args.evaluate)
        print(f"Força da senha: {nivel}")
        if feedback:
            print("Melhorias:")
            for item in feedback:
                print(f"- {item}")
        else:
            print("Senha bem segura!")
        executou_alguma_acao = True

    if not executou_alguma_acao:
        menu()

    return 0


def main():
    parser = construir_parser()
    args = parser.parse_args()
    return executar_cli(args)


if __name__ == "__main__":
    raise SystemExit(main())