export const assets = {
  titlescreen: {
    background: '/final/titlescreen/extended background.png',
    playBtn: '/placeholders/titlescreen/PlayBtn.PNG',
    title: '/final/titlescreen/title.png',
  },
  game: {
    background: '/final/game/Background.PNG',
    bomb: '/final/game/Bombe.PNG',
    explosion: '/final/game/Explosion.PNG',
    // Use of spritesheet for example, they are good for general performance and also avoid having to fix placement
    // of every single chest here, since I'm not using an level/ui editor.
    //
    // IT blows my mind that a different folder is not considered in the individual frame name.
    // frame0000.png has to be unique or will be overridden, without regards for filename it comes from.
    // Even with a single big spritesheet, which is the usual on games, this issue remains in texture packer.
    // I ended up manually updating the jsons.
    chestSP: '/final/game/chest.sp.json',
    planeSP: '/final/game/plane.sp.json',
  },
};
