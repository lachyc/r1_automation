import { AutoR1ProjectFile, AutoR1TemplateFile } from '../../autor1';
import * as fs from 'fs';

const PROJECT_NO_INIT_START = './src/__tests__/Projects/test_no_init.dbpr';
const PROJECT_INIT_START = './src/__tests__/Projects/test_init.dbpr';
const PROJECT_INIT_AP_START = './src/__tests__/Projects/test_init_AP.dbpr';
const TEMPLATES_START = './src/__tests__/Projects/templates.r2t';
const PROJECT_NO_EXIST = '/non/existent/path'
let PROJECT_NO_INIT: string;
let PROJECT_INIT: string;
let PROJECT_INIT_AP: string;
let TEMPLATES: string;

let i = 100;

// Create a new project file for each test
beforeEach(() => {
    PROJECT_INIT = PROJECT_INIT_START + i + '.test';
    PROJECT_INIT_AP = PROJECT_INIT_AP_START + i + '.test';
    PROJECT_NO_INIT = PROJECT_NO_INIT_START + i + '.test';
    TEMPLATES = TEMPLATES_START + i + '.test';

    fs.copyFileSync(PROJECT_NO_INIT_START, PROJECT_NO_INIT);
    fs.copyFileSync(PROJECT_INIT_START, PROJECT_INIT);
    fs.copyFileSync(PROJECT_INIT_AP_START, PROJECT_INIT_AP);
    fs.copyFileSync(TEMPLATES_START, TEMPLATES);
});

afterEach(() => {
    fs.unlinkSync(PROJECT_NO_INIT);
    fs.unlinkSync(PROJECT_INIT);
    fs.unlinkSync(PROJECT_INIT_AP);
    fs.unlinkSync(TEMPLATES);
});

describe('Methods', () => {
    let p: AutoR1ProjectFile;
    beforeEach(() => {
        p = new AutoR1ProjectFile(PROJECT_INIT);
    });

    it('Constructor throws with non-existing proejct', () => {
        expect(() => new AutoR1ProjectFile(PROJECT_NO_EXIST)).toThrow('File does not exist');
    });

    it('Constructor throws with unintialised proejct', () => {
        jest.resetAllMocks()
        expect(() => new AutoR1ProjectFile(PROJECT_NO_INIT)).toThrow('Project file is not initialised');
    });

    it('Next joinedId is determined', () => {
        expect(p!['jId']).not.toBe(-1);
    });

    it('Finds number of groups in project', () => {
        expect(p.getAllGroups().length).toBe(283);
    });

    it('Finds name of a source group from a group ID', () => {
        const p = new AutoR1ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupNameFromID(1)).toBe('Unused channels');
    });

    it('Finds ID of a source group from a source group name', () => {
        const p = new AutoR1ProjectFile(PROJECT_INIT)
        expect(p.getSourceGroupIDFromName('Unused channels')).toBe(1);
    });

    it('Finds the highest group ID', () => {
        expect(p.getHighestGroupID()).toBe(283);
    });

    it('Finds a groups ID from its name', () => {
        expect(p.getGroupIdFromName('Master')).toBe(2);
    });

    it('Finds the ID of a view group from its name', () => {
        expect(p.getViewIdFromName('Overview')).toBe(1000);
    });

    it('Creates a new group', () => {
        const newId = p.createGrp('test');
        expect(p.getGroupIdFromName('test')).toBe(newId);
    });

    it('Removes a group', () => {
        const newId = p.createGrp('test');
        expect(p.getGroupIdFromName('test')).toBe(newId);
        p.deleteGroup(newId);
        expect(() => p.getGroupIdFromName('test')).toThrow('Could not find group');
    });

    it('Discovers all source groups, channel groups and related info from a project', () => {
        p.getSrcGrpInfo()
        expect(p.sourceGroups.length).toBe(11);
        expect(p.sourceGroups[0].channelGroups.length).toBe(3); // Array two way tops
        expect(p.sourceGroups[1].channelGroups.length).toBe(3); // Array single channel tops
        expect(p.sourceGroups[2].channelGroups.length).toBe(3); // Array two way subs
        expect(p.sourceGroups[3].channelGroups.length).toBe(3); // Array single channel subs
        expect(p.sourceGroups[4].channelGroups.length).toBe(6); // Array flown mixed sub top
        expect(p.sourceGroups[5].channelGroups.length).toBe(1); // Array mono
        expect(p.sourceGroups[6].channelGroups.length).toBe(2); // Array ground stack mono
        expect(p.sourceGroups[7].channelGroups.length).toBe(1); // Point source
        expect(p.sourceGroups[8].channelGroups.length).toBe(1); // Point source sub
        expect(p.sourceGroups[9].channelGroups.length).toBe(2); // Point source mixed
        expect(p.sourceGroups[10].channelGroups.length).toBe(1); // SUB array LCR

    });
});

describe('Variables', () => {
    it('JoinedId is set on initial project load', () => {
        let p: AutoR1ProjectFile;
        expect(() => p = new AutoR1ProjectFile(PROJECT_INIT)).not.toThrow();
        expect(p!['jId']).not.toBe(-1);
    });
});

describe('insertTemplate', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('should insert a new template into the project file', () => {
        const posX = 100;
        const posY = 200;
        const TargetId = 123;
        const TargetChannel = 1;
        const Width = 100;
        const Height = 50;

        const template = templateFile.templates[1];
        const ViewId = 1000;
        const DisplayName = 'My Display Name';

        const oldJoinedId = projectFile.getHighestJoinedID();
        projectFile.insertTemplate(template, ViewId, posX, posY, { DisplayName, TargetId, TargetChannel, Width, Height });
        const newJoinedId = projectFile.getHighestJoinedID();

        const controls = projectFile.getControlsByViewId(ViewId);
        expect(newJoinedId).toBeGreaterThan(oldJoinedId);
        const insertedControls = controls.filter((c) => c.JoinedId === newJoinedId)

        const insertedControl = insertedControls[0];
        expect(insertedControl).toBeDefined();
        expect(insertedControl!.Type).toBe(template.controls![0].Type);
        expect(insertedControl!.PosX).toBe(posX);
        expect(insertedControl!.PosY).toBe(posY);
        expect(insertedControl!.Width).toBe(Width);
        expect(insertedControl!.Height).toBe(Height);
        expect(insertedControl!.TargetId).toBe(TargetId);
        // expect(insertedControl!.TargetChannel).toBe(TargetChannel);
    });
});

describe('getTemplateWidthHeight', () => {
    let projectFile: AutoR1ProjectFile;
    let templateFile: AutoR1TemplateFile;

    beforeEach(() => {
        projectFile = new AutoR1ProjectFile(PROJECT_INIT);
        templateFile = new AutoR1TemplateFile(TEMPLATES);
    });

    it('should return the size of the template', () => {
        const size = templateFile.getTemplateWidthHeight('Meters Group');
        expect(size.width).toBe(220);
        expect(size.height).toBe(214);
    });
});