/**
 * 要素が画面に入ったら `is-visible` を付ける。グラフの登場アニメーションの開始合図に使う。
 * アニメーションの定義は app.css の `.reveal` を参照。
 */
export function reveal(node: HTMLElement) {
  node.classList.add('reveal');
  if (!('IntersectionObserver' in window)) {
    node.classList.add('is-visible');
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        node.classList.add('is-visible');
        observer.disconnect();
      }
    },
    { threshold: 0.15 },
  );
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
