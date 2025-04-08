export const assets = {
  titlescreen: {
    background: `${process.env.SUBPATH ?? ''}/final/titlescreen/extended background.png`,
    title: `${process.env.SUBPATH ?? ''}/final/titlescreen/title.png`,
  },
  game: {
    background: `${process.env.SUBPATH ?? ''}/final/game/Background.PNG`,
    bomb: `${process.env.SUBPATH ?? ''}/final/game/Bombe.PNG`,
    explosion: `${process.env.SUBPATH ?? ''}/final/game/Explosion.PNG`,
    gueuxA: `${process.env.SUBPATH ?? ''}/final/game/GueuxA.png`,
    gueuxB: `${process.env.SUBPATH ?? ''}/final/game/GueuxB.png`,

    // Use of spritesheet for example, they are good for general performance and also avoid having to fix placement
    // of every single chest here, since I'm not using an level/ui editor.
    //
    // IT blows my mind that a different folder is not considered in the individual frame name.
    // frame0000.png has to be unique or will be overridden, without regards for filename it comes from.
    // Even with a single big spritesheet, which is the usual on games, this issue remains in texture packer.
    // I ended up manually updating the jsons.
    chestSP: `${process.env.SUBPATH ?? ''}/final/game/chest.sp.json`,
    planeSP: `${process.env.SUBPATH ?? ''}/final/game/plane.sp.json`,
  },
};
