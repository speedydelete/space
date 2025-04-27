
const {abs} = Math;

export function length(value: number, digits: number = 3): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (abs(value) > 946073047258080) {
        return (value/9460730472580.8e3).toFixed(digits) + ' ly';
    } else if (abs(value) > 14959787070) {
        return (value/149597870700).toFixed(digits) + ' AU';
    } else if (abs(value) > 1000) {
        return (value/1000).toFixed(digits) + ' km';
    } else {
        return value.toFixed(digits) + ' m';
    }
}

export function time(value: number, digits: number = 3): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (value > 31536000) {
        return (value/31536000).toFixed(digits) + ' y';
    } else if (value > 86400) {
        return (value/86400).toFixed(digits) + ' d';
    } else if (value > 3600) {
        return (value/3600).toFixed(digits) + ' h';
    } else if (value > 60) {
        return (value/60).toFixed(digits) + ' m';
    } else {
        return value.toFixed(digits) + ' s';
    }
}

export function formatMass(value: number, digits: number = 3): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (value > 1.9891e28) {
        return (value/1.9891e30).toFixed(digits) + ' solar masses';
    } else if (value > 5.9722e22) {
        return (value/5.9722e24).toFixed(digits) + ' earth masses';
    } else {
        return value.toFixed(digits) + ' kg';
    }
}

export function date(value: number): string {
    if (isNaN(value)) {
        return 'NaN';
    }
    try {
        return (new Date(value*1000)).toISOString().replace('T', ' ').replace('Z', '');
    } catch (e) {
        return `Beyond +275698-03-2`;
    }
}


function toRomanNumeral(value: number): string {
    if (isNaN(value)) {
        return 'NaN';
    } else if (value === 0) {
        return 'N';
    } else if (value >= 4000) {
        throw new Error(`Cannot convert ${value} to a Roman numeral`);
    }
    let frac = '';
    if (!Number.isInteger(value)) {
        if (value >= 0.5) {
            value -= 0.5;
            frac += 'S';
        }
        if (!Number.isInteger(value * 12)) {
            throw new Error(`Cannot convert ${value} to a Roman numeral`);
        }
        frac += '·'.repeat((value % 1) * 12);
        value = Math.floor(value);
    }
    let out = 'M'.repeat(Math.floor(value / 1000));
    value %= 1000;
    out += ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM'][Math.floor(value / 100)];
    out += ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'LC'][Math.floor((value % 100) / 10)];
    out += ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][value % 10];
    return out + frac;
}

const GREEK_LETTERS: {[key: string]: [string, string]} = {
    alpha: ['Α', 'α'],
    beta: ['Β', 'β'],
    gamma: ['Γ', 'γ'],
    delta: ['Δ', 'δ'],
    epsilon: ['Ε', 'ε'],
    zeta: ['Ζ', 'ζ'],
    eta: ['Η', 'η'],
    theta: ['Θ', 'θ'],
    iota: ['Ι', 'ι'],
    kappa: ['Κ', 'κ'], 
    lambda: ['Λ', 'λ'],
    mu: ['Μ', 'μ'],
    nu: ['Ν', 'ν'],
    xi: ['Ξ', 'ξ'],
    omicron: ['Ο', 'ο'],
    pi: ['Π', 'π'],
    rho: ['Ρ', 'ρ'],
    sigma: ['Σ', 'σ'],
    tau: ['Τ', 'τ'],
    upsilon: ['Υ', 'υ'],
    phi: ['Φ', 'φ'],
    chi: ['Χ', 'χ'],
    psi: ['Ψ', 'ψ'],
    omega: ['Ω', 'ω'],
};

const CONSTELLATIONS: {[key: string]: [string, string, string]} = {
    and: ['Andromeda', 'Andromedae', 'And'],
    ant: ['Antlia', 'Antliae', 'Ant'],
    aps: ['Apus', 'Apodis', 'Aps'],
    aqr: ['Aquarius', 'Aquarii', 'Aqr'],
    aql: ['Aquila', 'Aquilae', 'Aql'],
    ara: ['Ara', 'Arae', 'Ara'],
    ari: ['Aries', 'Arietis', 'Ari'],
    aur: ['Auriga', 'Aurigae', 'Aur'],
    boo: ['Boötes', 'Boötis', 'Boo'],
    cae: ['Caelum', 'Caeli', 'Cae'],
    cam: ['Camelopardalis', 'Camelopardalis', 'Cam'],
    cnc: ['Cancer', 'Cancri', 'Cnc'],
    cvn: ['Canes Venatici', 'Canum Venaticorum', 'CVn'],
    cma: ['Canis Major', 'Canis Majoris', 'CMa'],
    cmi: ['Canis Minor', 'Canis Minoris', 'CMi'],
    cap: ['Capricornus', 'Capricorni', 'Cap'],
    car: ['Carina', 'Carinae', 'Car'],
    cas: ['Cassiopeia', 'Cassiopeiae', 'Cas'],
    cen: ['Centaurus', 'Centauri', 'Cen'],
    cep: ['Cepheus', 'Cephei', 'Cep'],
    cet: ['Cetus', 'Ceti', 'Cet'],
    cha: ['Chamaeleon', 'Chamaeleontis', 'Cha'],
    cir: ['Circinus', 'Circini', 'Cir'],
    col: ['Columba', 'Columbae', 'Col'],
    com: ['Coma Berenices', 'Comae Berenices', 'Com'],
    cra: ['Corona Australis', 'Coronae Australis', 'CrA'],
    crb: ['Corona Borealis', 'Coronae Borealis', 'CrB'],
    crv: ['Corvus', 'Corvi', 'Crv'],
    crt: ['Crater', 'Crateris', 'Crt'],
    cru: ['Crux', 'Crucis', 'Cru'],
    cyg: ['Cygnus', 'Cygni', 'Cyg'],
    del: ['Delphinus', 'Delphini', 'Del'],
    dor: ['Dorado', 'Doradus', 'Dor'],
    dra: ['Draco', 'Draconis', 'Dra'],
    equ: ['Equueleus', 'Equulei', 'Equ'],
    eri: ['Eridanus', 'Eridani', 'Eri'],
    for: ['Fornax', 'Fornacis', 'For'],
    gem: ['Gemini', 'Geminorum', 'Gem'],
    gru: ['Grus', 'Gruis', 'Gru'],
    her: ['Hercules', 'Herculis', 'Her'],
    hor: ['Horologium', 'Horologii', 'Hor'],
    hya: ['Hydra', 'Hydrae', 'Hya'],
    hyi: ['Hydrus', 'Hydri', 'Hyi'],
    ind: ['Indus', 'Indi', 'Ind'],
    lac: ['Lacerta', 'Lacertae', 'Lac'],
    leo: ['Leo', 'Leonis', 'Leo'],
    lmi: ['Leo Minor', 'Leonis Minoris', 'LMi'],
    lep: ['Lepus', 'Leporis', 'Lep'],
    lib: ['Libra', 'Librae', 'Lib'],
    lup: ['Lupus', 'Lupi', 'Lup'],
    lyn: ['Lynx', 'Lyncis', 'Lyn'],
    lyr: ['Lyra', 'Lyrae', 'Lyr'],
    men: ['Mensa', 'Mensae', 'Men'],
    mic: ['Microscopium', 'Microscopiae', 'Mic'],
    mon: ['Monoceros', 'Monocerotis', 'Mon'],
    mus: ['Musca', 'Muscae', 'Mus'],
    nor: ['Norma', 'Normae', 'Nor'],
    oct: ['Octans', 'Octantis', 'Oct'],
    oph: ['Ophiuchus', 'Ophiuchi', 'Oph'],
    ori: ['Orion', 'Orionis', 'Ori'],
    pav: ['Pavo', 'Pavonis', 'Pav'],
    peg: ['Pegasus', 'Pegasi', 'Peg'],
    per: ['Perseus', 'Persei', 'Per'],
    phe: ['Phoenix', 'Phoenicis', 'Phe'],
    pic: ['Pictor', 'Pictoris', 'Pic'],
    psc: ['Pisces', 'Piscium', 'Psc'],
    psa: ['Piscis Austrinus', 'Piscis Austrini', 'PsA'],
    pup: ['Puppis', 'Puppis', 'Pup'],
    pyx: ['Pyxis', 'Pyxidis', 'Pyx'],
    ret: ['Reticulum', 'Reticuli', 'Ret'],
    sge: ['Sagitta', 'Sagittae', 'Sge'],
    sgr: ['Sagittarius', 'Sagittarii', 'Sgr'],
    sco: ['Scorpius', 'Scorpii', 'Sco'],
    scl: ['Sculptor', 'Sculptoris', 'Scl'],
    sct: ['Suctum', 'Scuti', 'Sct'],
    ser: ['Serpens', 'Serpentis', 'Ser'],
    sex: ['Sextans', 'Sextantis', 'Sex'],
    tau: ['Taurus', 'Tauri', 'Tau'],
    tel: ['Telescopium', 'Telescopii', 'Tel'],
    tri: ['Triangulum', 'Trianguli', 'Tri'],
    tra: ['Triangulum Australe', 'Trianguli Australis', 'TrA'],
    tuc: ['Tucana', 'Tucanae', 'Tuc'],
    uma: ['Ursa Major', 'Ursae Majoris', 'UMa'],
    umi: ['Ursa Minor', 'Ursae Minoris', 'UMi'],
    vel: ['Vela', 'Velorium', 'Vel'],
    vir: ['Virgo', 'Virginis', 'Vir'],
    vol: ['Volans', 'Volantis', 'Vol'],
    vul: ['Vulpecula', 'Vulpeculae', 'Vul'],
};

export function objectName(name: string, desgn: string, short?: boolean): string {
    let [ns, _data] = desgn.split(':');
    let data = _data.split('/');
    if (ns === 'special' || ns === 'planet') {
        return name;
    } else if (ns === 'moon') {
        return name + '(' + data[0].toUpperCase() + ' ' + toRomanNumeral(parseInt(data[1])) + ')';
    } else if (ns === 'star') {
        let constl = CONSTELLATIONS[data[0]][short ? 2 : 1];
        let des;
        if (data[1] in GREEK_LETTERS) {
            des = GREEK_LETTERS[data[1]][1] + ' ' + constl;
        } else {
            des = data[1] + ' ' + constl;
        }
        if (name !== '') {
            return name + '(' + des + ')';
        } else {
            return des;
        }
    } else {
        throw new Error(`Invalid designation: ${desgn}`);
    }
}
