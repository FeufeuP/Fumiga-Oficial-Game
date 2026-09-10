# Verificação visual — Stage 1

## Desktop 1280×720

O canvas ocupa o viewport e mostra o grid subterrâneo, a câmara inicial, a Rainha central, seis operárias e quatro nós de Biomassa. O HUD superior comunica a identidade do FUMIGA com paleta de terra e âmbar. O cartão de pausa tática aparece no canto superior direito. A barra de vida da Rainha permanece legível na parte inferior.

## Mobile 390×844

O HUD superior continua legível e os recursos foram reduzidos para números com ícones. A câmara fica visível na região central, com a Rainha e os nós de Biomassa identificáveis. A barra da Rainha e a instrução de long press permanecem acessíveis.

## Ajuste posterior recomendado

No viewport mobile muito estreito, existe espaço vertical vazio acima da câmara porque o canvas 16:9 é preservado pelo FIT. Na próxima iteração, considerar um modo de composição mobile que aumente a câmara ou reposicione o HUD sem perder a área segura. Não é bloqueador para a primeira entrega do slice.

## Validação interativa

O preview abriu no navegador WebDev sem erros visíveis. O botão `ART BIBLE` abriu corretamente o modal com a referência visual armazenada em `/manus-storage/fumiga-visual-target-stage0_aa3a44e2.png`, título e explicação da direção artística. O canvas Phaser e o HUD React permaneceram carregados atrás do modal.
