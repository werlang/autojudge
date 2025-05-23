#include <stdio.h>

int val1, val2;

int main(void) {
  // lê dois valores inteiros
  scanf("%d%d", &val1, &val2);

  // escreve o resultado
  if (val1 > val2) 
    printf("%d\n", val1);
  else
    printf("%d\n", val2);

  // termina a execução
  return 0;
}