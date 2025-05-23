#include<iostream>
using namespace std;

int val1, val2;

int main(void) {
  // lê as duas vals
  cin >> val1 >> val2;

  // escreve o resultado
  if (val1 > val2)
    cout << val1 << endl;
  else
    cout << val2 << endl;

  // termina a execução
  return 0;
}