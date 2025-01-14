/*##############################################################################

    HPCC SYSTEMS software Copyright (C) 2012 HPCC Systems®.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
############################################################################## */

#option ('targetClusterType', 'roxie');

numInitialRecord := 1000;
filterSuccess := 100;
secondExpand := 2000;
finalNumber := 40;

rec := record
unsigned    id1;
unsigned    id2;
unsigned    score;
        end;





dataset(rec) processLoop(dataset(rec) input, unsigned step) := function

    //create lots of inital records
    dataset(rec) stepOne() := function
        initial := dataset([{0,0,step}], rec);
        return normalize(initial, numInitialRecord, transform(rec, self.id1 := counter; self := []));
    end;

    //reduce the number right down again
    dataset(rec) stepTwo() := function
        return input(id1 % filterSuccess = 1);
    end;

    //now expand them up again
    dataset(rec) stepThree() := function
        return normalize(input, numInitialRecord, transform(rec, self.id1 := left.id1; self.id2 := counter; self.score := left.id1 - counter; ));
    end;

    //filter back down
    dataset(rec) stepFour() := function
        return topn(input, finalNumber, score);
    end;

    return case(step,
        1=>stepOne(),
        2=>stepTwo(),
        3=>stepThree(),
        4=>stepFour()
        );

end;



initial := dataset([], rec);
results := LOOP(initial, 4, processLoop(rows(left), counter), parallel([2,2]));
output(results);

results2 := LOOP(initial, 4, (left.id1 > counter), processLoop(rows(left), counter), parallel([2],2));
output(results2);
