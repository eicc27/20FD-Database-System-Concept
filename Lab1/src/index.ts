import {DataLoader} from "./DataLoader.js";
import "reflect-metadata"
import Connection from "./sqlite3/Connection.js";
import Room from "./types/Room.js";
import Student from "./types/Student.js";
import {Logger, SigLevel} from "./utils/Logger.js";
import chalk from "chalk";

const roomData: string[][] = new DataLoader('./data/room.csv').load(',', true, 'gbk');
const studentData: string[][] = new DataLoader('./data/student.csv').load(',', true, 'utf-8');

const rooms: Room[] = roomData.map((value) => {
    const params = value.map((value) => {
        return value.length ? value : null
    });
    return new Room(params[0], params[1], params[2], params[3], params[4], params[5]);
});

const students: Student[] = studentData.map((value) => {
    const params = value.map((value) => {
        return value.length ? value : null
    });
    return new Student(params[0], params[1], params[2], params[3], params[4], params[5]);
})

Logger.log(SigLevel.info, `Running SQLite ${chalk.blueBright('create table')} and ${chalk.blueBright('insert or update')}`);

const connection = new Connection('./db/lab1.db', Room)
    .createTable(Room)
    .insert_or_update(rooms, 'kdno', 'kcno', 'ccno')
    .switchTable(Student)
    .createTable(Student)
    .upsert(students, 'registno');

Logger.log(SigLevel.info, `Running SQLite queries`);

connection.selectAllWhenPropertyEqual(new Room(null, null, null, null, null, null));
connection.selectAllWhenPropertyEqual(new Room(null, null, null, null, '2004-06-10  13:40', null));
connection.selectAllWhenPropertyEqual(new Student(null, null, null, '2', '1', null));
connection.selectAllWhenPropertyEqual(new Student('0358100', null, null, null, null, null), 'id', 'name', 'seat');

Logger.log(SigLevel.ok, `General test finished`);