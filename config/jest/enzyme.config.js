import { TextEncoder} from 'util';
const { configure } = require('enzyme');

global.TextEncoder = TextEncoder;

const Adapter = require('enzyme-adapter-react-16');

configure({ adapter: new Adapter() });
