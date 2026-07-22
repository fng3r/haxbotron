import * as mapBig from "./stadium/big.hbs.js";
import * as mapBigEasy from "./stadium/bigeasy.hbs.js";
import * as mapClassic from "./stadium/classic.hbs.js";
import * as mapGBHotBig from "./stadium/gbhotbig.hbs.js";
import * as mapGBHotClassic from "./stadium/gbhotclassic.hbs.js";
import * as mapRealSoccer from "./stadium/realsoccer.hbs.js";
import * as mapFutsal1v1 from "./stadium/futsal_1v1.hbs.js";
import * as mapFutsal4v4 from "./stadium/futsal_4v4.hbs.js";
import * as mapIceBear from "./stadium/icebearslow.hbs.js";
import * as mapBff4v4 from "./stadium/bff_4v4.hbs.js";
import * as map6man from "./stadium/6man.hbs.js";

/**
 * Resolve bundled stadium data by map name.
 */
export function getStadiumData(mapName: string): string | null {
    // LINK MAP FILE
    switch (mapName) {
        case 'big':
            return mapBig.stadiumText;
        case 'bigeasy':
            return mapBigEasy.stadiumText;
        case 'classic':
            return mapClassic.stadiumText;

        case 'gbhotbig':
            return mapGBHotBig.stadiumText;
        case 'gbhotclassic':
            return mapGBHotClassic.stadiumText;
        case 'realsoccer':
            return mapRealSoccer.stadiumText;

        case 'futsal1v1':
            return mapFutsal1v1.stadiumText;
        case 'futsal4v4':
            return mapFutsal4v4.stadiumText;
        case 'bff4v4':
            return mapBff4v4.stadiumText;
        case 'icebear':
            return mapIceBear.stadiumText;
        case '6man':
            return map6man.stadiumText;

        default:
            return null;
    }
}
