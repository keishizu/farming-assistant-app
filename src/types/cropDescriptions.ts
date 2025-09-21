export interface CropBasicInfo {
  difficulty: string;
  plantingSeason: string;
  harvestSeason: string;
  growingPeriod: string;
  advice: string;
}

export const cropBasicInfo: Record<string, CropBasicInfo> = {
  "さつまいも": {
    difficulty: "★☆☆（かんたん）",
    plantingSeason: "5月中旬〜6月",
    harvestSeason: "9月〜11月",
    growingPeriod: "およそ4〜5ヶ月",
    advice: `水はけの良い畑に斜め植え。根付くまでは軽く水をやり、その後は乾燥気味に管理しよう。
収穫後は1〜2週間ほど風通しの良い場所で寝かせると、甘みがグッと増します！`,
  },
}; 