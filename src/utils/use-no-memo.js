const useNoMemo = (factory) => {
  'use no memo';
  return factory();
}

export default useNoMemo;