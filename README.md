# D35E Little Helper

Módulo de qualidade de vida para o **Foundry Virtual Tabletop 13** e o sistema **D35E 3.1.0**.

## Instalação

No Foundry, abra **Add-on Modules → Install Module**, cole este endereço em **Manifest URL** e confirme:

```text
https://github.com/MestreWellDark/35LittleHelp/releases/latest/download/module.json
```

Também é possível baixar o arquivo `d35e-little-helper.zip` na página de [Releases](https://github.com/MestreWellDark/35LittleHelp/releases/latest) e extrair a pasta na pasta `Data/modules` do Foundry.

## Funcionalidades

- Resumo nas fichas de ator com contagem de itens, talentos, magias e buffs.
- Estimativa de carga carregada, incluindo peso de moedas configurável.
- Avisos para itens equipados sem espaço corporal, excesso de pontos de perícia e token protótipo não vinculado.
- Resumo de CD base por grimório: `10 + modificador de habilidade + nível da magia`.
- Propriedades e avisos úteis nas fichas de itens.
- Destaque visual de 20 natural e 1 natural no chat.
- Exibição do modificador total, repetição de rolagem, cópia de fórmula e mensagens recolhíveis.
- Fórmulas inline identificáveis e validação de campos com referências `@dados`.
- Nomes legíveis nas condições do HUD de token.
- Painel dos buffs ativos do token controlado; clique para abrir e botão direito para desativar.
- Avisos de preparação da cena para visão e tokens de jogadores.
- Cópia rápida de UUID em fichas e diretórios.
- Opções de ficha compacta e expansão automática de pastas.
- Traduções em português do Brasil e inglês.

Todas as funções podem ser ativadas ou desativadas em **Configurações do módulo**.

## Compatibilidade

| Componente | Versão |
|---|---:|
| Foundry VTT | 13 |
| Sistema D35E | 3.1.0 |
| Dependências | Nenhuma |

## Desenvolvimento

Requer Node.js 20 ou superior.

```bash
npm run validate
npm test
```

Cada envio para o repositório executa validação do manifesto, paridade das traduções, testes unitários, verificação de sintaxe e criação de um pacote de teste. Um envio para `main` publica automaticamente os arquivos instaláveis da versão declarada no `module.json`.

## Origem do projeto

O conjunto de ideias foi inspirado pelo [Koboldworks PF1 Little Helper](https://gitlab.com/koboldworks/pf1/little-helper), adaptado para a estrutura e os dados do D35E. Este repositório contém uma implementação independente, escrita para o D35E 3.1.0, sem copiar o código-fonte do módulo original.

## Licença

[MIT](LICENSE)
