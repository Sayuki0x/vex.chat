export const uniqueArray = (arr: any[]) => {
  return arr.filter((thing: any, index: number) => {
    const _thing = JSON.stringify(thing);
    return (
      index ===
      arr.findIndex((obj) => {
        return JSON.stringify(obj) === _thing;
      })
    );
  });
};
