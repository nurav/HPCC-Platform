/*##############################################################################
#    HPCC SYSTEMS software Copyright (C) 2012 HPCC Systems®.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
############################################################################## */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/i18n",
    "dojo/i18n!./nls/hpcc",
    "dojo/_base/Deferred",
    "dojo/promise/all",
    "dojo/store/Observable",
    "dojo/topic",

    "hpcc/ESPRequest"
], function (declare, lang, arrayUtil, i18n, nlsHPCC, Deferred, all, Observable, topic,
    ESPRequest) {

    var EventScheduleStore = declare([ESPRequest.Store], {
            service: "WsWorkunits",
            action: "WUShowScheduled",
            responseQualifier: "WUShowScheduledResponse.Workunits.ScheduledWU",
            idProperty: "Wuid"
    });

    return {
        States: {
            0: "unknown",
            1: "compiled",
            2: "running",
            3: "completed",
            4: "aborting",
            5: "aborted",
            6: "blocked",
            7: "submitted",
            8: "wait",
            9: "failed",
            10: "compiling",
            11: "uploading_files",
            12: "debugging",
            13: "debug_running",
            14: "paused",
            999: "deleted"
        },

        WUCreate: function (params) {
            return ESPRequest.send("WsWorkunits", "WUCreate", params).then(function (response) {
                topic.publish("hpcc/ecl_wu_created", {
                    wuid: response.WUCreateResponse.Workunit.Wuid
                });
                return response;
            });
        },

        WUUpdate: function (params) {
            ESPRequest.flattenMap(params.request, "ApplicationValues")
            return ESPRequest.send("WsWorkunits", "WUUpdate", params);
        },

        WUSubmit: function (params) {
            return ESPRequest.send("WsWorkunits", "WUSubmit", params);
        },

        WUResubmit: function (params) {
            return ESPRequest.send("WsWorkunits", "WUResubmit", params);
        },

        WUQueryDetails: function (params) {
            return ESPRequest.send("WsWorkunits", "WUQueryDetails", params);
        },

        WUGetZAPInfo: function (params) {
            return ESPRequest.send("WsWorkunits", "WUGetZAPInfo", params);
        },

        WUShowScheduled: function (params) {
            return ESPRequest.send("WsWorkunits", "WUShowScheduled", params);
        },

        WUPushEvent: function (params) {
            return ESPRequest.send("WsWorkunits", "WUPushEvent", params);
        },

        WUQuerysetAliasAction: function (selection, action) {
            var requests = [];
            arrayUtil.forEach(selection, function (item, idx) {
                var request = {
                    QuerySetName: item.QuerySetId,
                    Action: action,
                    "Aliases.QuerySetAliasActionItem.0.Name": item.Name,
                    "Aliases.QuerySetAliasActionItem.itemcount": 1
                };
                requests.push(ESPRequest.send("WsWorkunits", "WUQuerysetAliasAction", {
                    request: request
                }));
            });
            return all(requests);
        },

        WUQuerysetQueryAction: function (selection, action) {
            if (action === "Deactivate") {
                return this.WUQuerysetAliasAction(selection, action);
            }
            var requests = [];
            arrayUtil.forEach(selection, function (item, idx) {
                var request = {
                    QuerySetName: item.QuerySetId,
                    Action: action,
                    "Queries.QuerySetQueryActionItem.0.QueryId": item.Id,
                    "Queries.QuerySetQueryActionItem.itemcount": 1
                };
                requests.push(ESPRequest.send("WsWorkunits", "WUQuerysetQueryAction", {
                    request: request
                }));
            });
            return all(requests);
        },
        
        WUListQueries: function (params) {
            return ESPRequest.send("WsWorkunits", "WUListQueries", params);
        },

        CreateQuerySetStore: function (options) {
            var store = new QuerySetStore(options);
            return Observable(store);
        },

        WUPublishWorkunit: function (params) {
            return ESPRequest.send("WsWorkunits", "WUPublishWorkunit", params).then(function (response) {
                if (lang.exists("WUPublishWorkunitResponse", response)) {
                    if (response.WUPublishWorkunitResponse.ErrorMesssage) {
                        topic.publish("hpcc/brToaster", {
                            Severity: "Error",
                            Source: "WsWorkunits.WUPublishWorkunit",
                            Exceptions: response.Exceptions
                        });
                    } else {
                        dojo.publish("hpcc/brToaster", {
                            Severity: "Message",
                            Source: "WsWorkunits.WUPublishWorkunit",
                            Exceptions: [{ Source: params.request.Wuid, Message: nlsHPCC.Published + ":  " + response.WUPublishWorkunitResponse.QueryId }]
                        });
                        topic.publish("hpcc/ecl_wu_published", {
                            wuid: params.request.Wuid
                        });
                    }
                }
                return response;
            });
        },

        WUQuery: function (params) {
            return ESPRequest.send("WsWorkunits", "WUQuery", params).then(function (response) {
                if (lang.exists("Exceptions.Exception", response)) {
                    arrayUtil.forEach(response.Exceptions.Exception, function (item, idx) {
                        if (item.Code === 20081) {
                            lang.mixin(response, {
                                WUQueryResponse: {
                                    Workunits: {
                                        ECLWorkunit: [{
                                            Wuid: params.request.Wuid,
                                            StateID: 999,
                                            State: "deleted"
                                        }]
                                    }
                                }
                            });
                        }
                    });
                }
                return response;
            });
        },

        WUInfo: function (params) {
            return ESPRequest.send("WsWorkunits", "WUInfo", params).then(function (response) {
                if (lang.exists("Exceptions.Exception", response)) {
                    arrayUtil.forEach(response.Exceptions.Exception, function (item, idx) {
                        if (item.Code === 20080) {
                            lang.mixin(response, {
                                WUInfoResponse: {
                                    Workunit: {
                                        Wuid: params.request.Wuid,
                                        StateID: 999,
                                        State: "deleted"
                                    }
                                }
                            });
                        }
                    });
                }
                return response;
            });
        },

        WUGetGraph: function (params) {
            return ESPRequest.send("WsWorkunits", "WUGetGraph", params);
        },

        WUResult: function (params) {
            return ESPRequest.send("WsWorkunits", "WUResult", params);
        },

        WUQueryGetGraph: function (params) {
            return ESPRequest.send("WsWorkunits", "WUQueryGetGraph", params);
        },

        WUFile: function (params) {
            lang.mixin(params, {
                handleAs: "text"
            });
            return ESPRequest.send("WsWorkunits", "WUFile", params);
        },

        WUAction: function (workunits, actionType, callback) {
            var request = {
                Wuids: workunits,
                WUActionType: actionType
            };
            ESPRequest.flattenArray(request, "Wuids", "Wuid");

            return ESPRequest.send("WsWorkunits", "WUAction", {
                request: request,
                load: function (response) {
                    if (lang.exists("WUActionResponse.ActionResults.WUActionResult", response)) {
                        var wuMap = {};
                        arrayUtil.forEach(workunits, function (item, index) {
                            wuMap[item.Wuid] = item;
                        });
                        arrayUtil.forEach(response.WUActionResponse.ActionResults.WUActionResult, function (item, index) {
                            if (item.Result.indexOf("Failed:") === 0) {
                                topic.publish("hpcc/brToaster", {
                                    Severity: "Error",
                                    Source: "WsWorkunits.WUAction",
                                    Exceptions: [{Source: item.Action + " " + item.Wuid, Message: item.Result}]
                                });
                            } else {
                                var wu = wuMap[item.Wuid];
                                if (actionType === "delete" && item.Result === "Success") {
                                    wu.set("StateID", 999);
                                    wu.set("State", "deleted");
                                } else if (wu.refresh) {
                                    wu.refresh();
                                }
                            }
                        });
                    }

                    if (callback && callback.load) {
                        callback.load(response);
                    }
                },
                error: function (err) {
                    if (callback && callback.error) {
                        callback.error(err);
                    }
                }
            });
        },

        WUGetStats: function (params) {
            return ESPRequest.send("WsWorkunits", "WUGetStats", params);
        },

        //  Stub waiting for HPCC-10308
        visualisations: [
            { value: "DojoD3ScatterChart", label: "Scatter Chart" },
            { value: "DojoD32DChart C3_SCATTER", label: "Scatter C3 Chart" },
            { value: "DojoD32DChart C3_PIE", label: "Pie Chart" },
            { value: "DojoD32DChart C3_DONUT", label: "Donut Chart" },
            { value: "DojoD32DChart C3_COLUMN", label: "Column Chart" },
            { value: "DojoD32DChart C3_BAR", label: "Bar Chart" },
            { value: "DojoD32DChart C3_LINE", label: "Line Chart" },
            { value: "DojoD32DChart C3_STEP", label: "Step Chart" },
            { value: "DojoD32DChart C3_AREA", label: "Area Chart" },
            { value: "DojoD3Choropleth", label: "Choropleth" },
            { value: "DojoD3CooccurrenceGraph", label: "Co-Occurrence Graph" },
            { value: "DojoD3ForceDirectedGraph", label: "Force Directed Graph" },
            { value: "DojoD3Histogram", label: "Histogram" },
            { value: "DojoD3WordCloud", label: "Word Cloud" }
        ],
        GetVisualisations:  function() {
            var deferred = new Deferred();
            if (this.visualisations) {
                deferred.resolve(this.visualisations);
            }
            return deferred.promise;
        },
        
        CreateEventScheduleStore: function (options) {
            var store = new EventScheduleStore(options);
            return Observable(store);
        },

        //  Helpers  ---
        isComplete: function (stateID, actionEx, archived) {
            if (archived) {
                return true;
            }
            switch (stateID) {
                case 1: //WUStateCompiled
                    if (actionEx && actionEx == "compile") {
                        return true;
                    }
                    break;
                case 3: //WUStateCompleted:
                case 4: //WUStateFailed:
                case 5: //WUStateArchived:
                case 7: //WUStateAborted:
                case 999: //WUStateDeleted:
                    return true;
            }
            return false;
        }
    };
});
