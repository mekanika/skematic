import * as Skematic from '../';

const demoModel: Skematic.Model = {
  created: {
    generate: () => new Date().toISOString()
  },
  name: {
    default: 'Generic Superhero'
  },
  power: {
    rules: { min: 4, isBig: (v: any) => v > 10 },
    transform: v => v.toNumber(),
    show: ['admin'],
    write: ['superadmin']
  }
};

// Check format()
const formatOptions: Skematic.FormatOptions = {
  scopes: ['admin', 'superadmin'],
  unscope: false,
  strict: false,
  defaults: true,
  once: true,
  unlock: true,
  strip: [undefined]
};

Skematic.format(demoModel, { name: 'Zim' });
Skematic.format(demoModel.name, 'Zim');

// Check validate()
const validateOptions: Skematic.ValidateOptions = {
  scopes: ['admin'],
  unscope: false,
  strict: true,
  sparse: true
};

Skematic.validate(demoModel, { hello: 'yes' });

Skematic.validate(demoModel.power, 20);
