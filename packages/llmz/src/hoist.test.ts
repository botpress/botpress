import { describe, it, expect } from 'vitest'

import { hoistTypings } from './hoist.js'

describe('hoist', () => {
  describe('types hoisting', () => {
    it('type hoisting across tools and objects works', async () => {
      const after = await hoistTypings(`
        type PersonWithId = { id: number; person: { name: string; age: number; } }

        declare const MyObject: {

        // ---------------- //
        //    Properties    //
        // ---------------- //

        someone: PersonWithId;
        someoneElse: { id: number; person: { name: string; age: number; } };
        readonly anOtherPerson: Optional<{ id: number; person: { name: string; age: number; } }>;
        
        personWithDifferentFormatting: {
          person: { name: string;
            age: number;
          };
          id: number;
        };

        personWithComments: {
          id: number;
          person: {
            // Name of the person
            name: string;
            // Age of the person
            age: number;
          };
        };

        // ---------------- //
        //       Tools      //
        // ---------------- //

        myTool(args: { children: Array<{ name: string; age: number }> }): { /* with comment */ abc: number };

        // Second tool
        MySecondTool(args: { children: Array<{ name: string; age: number }> }): { /* with comment */ abc: number };

        // 3rd Tool
        MyThirdTool(args: { children: Array<{ name: string; age: number }> }): { abc: number };

      }


        // ----------------------- //
        //       Global Tools      //
        // ----------------------- //

        declare function appendChildren(): { a: number; b: number; c: Array<{ name: string; age: number }> };
        declare function appendChildren2(): { a: number; b: number; c: Array<{ name: string; age: number }> };
        
        
      `)

      expect(after).toMatchInlineSnapshot(`
        "type PersonWithIdPerson = { name: string; age: number }
        type MyObjectMyToolArgs = { children: Array<PersonWithIdPerson> }
        type MyObjectMyToolOutput = {
          /* with comment */
          abc: number
        }
        type AppendChildrenOutput = {
          a: number
          b: number
          c: Array<PersonWithIdPerson>
        }

        type PersonWithId = { id: number; person: PersonWithIdPerson }

        declare const MyObject: {
          // ---------------- //
          //    Properties    //
          // ---------------- //
          someone: PersonWithId
          someoneElse: PersonWithId
          readonly anOtherPerson: Optional<PersonWithId>
          personWithDifferentFormatting: { person: PersonWithIdPerson; id: number }
          personWithComments: PersonWithId
          // ---------------- //
          //       Tools      //
          // ---------------- //
          myTool(args: MyObjectMyToolArgs): MyObjectMyToolOutput
          // Second tool
          MySecondTool(args: MyObjectMyToolArgs): MyObjectMyToolOutput
          // 3rd Tool
          MyThirdTool(args: MyObjectMyToolArgs): MyObjectMyToolOutput
        }

        // ----------------------- //
        //       Global Tools      //
        // ----------------------- //

        declare function appendChildren(): AppendChildrenOutput
        declare function appendChildren2(): AppendChildrenOutput"
      `)
    })
  })
})
