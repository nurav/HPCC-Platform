################################################################################
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
################################################################################


# Component: esphttp 

#####################################################
# Description:
# ------------
#    Cmake Input File for esphttp
#####################################################


project( esphttp ) 

set (    SRCS 
         ../../bindings/bindutil.cpp 
         ../../bindings/http/client/httpclient.cpp 
         ../../bindings/http/platform/htmlpage.cpp 
         ../../bindings/http/platform/httpbinding.cpp 
         ../../bindings/http/platform/httpprot.cpp 
         ../../bindings/http/platform/httpservice.cpp 
         ../../bindings/http/platform/httptransport.cpp 
         ../../bindings/http/platform/mime.cpp 
         ../../bindings/http/platform/msgbuilder.cpp 
         ../../bindings/SOAP/client/soapclient.cpp 
         ../../bindings/SOAP/Platform/soapbind.cpp 
         ../../bindings/SOAP/Platform/soapmessage.cpp 
         ../../bindings/SOAP/Platform/soapservice.cpp 
         ../../bindings/SOAP/Platform/soapparam.cpp
         ../../platform/espcontext.cpp 
         ../../platform/espprotocol.cpp 
         ../../platform/espthread.cpp 
         ../../platform/sechandler.cpp 
         mapinfo.cpp 
         plugin.cpp 
    )

include_directories ( 
         ./../../../system/include 
         ./../../../system/security/shared
         ./../../../system/security/securesocket 
         ./../../bindings 
         ./../../bindings/SOAP/xpp 
         ./../../../system/xmllib 
         ./../../../system/jlib 
         ./../../platform 
         ./../../../system/security/shared 
         ./../../../system/security/LdapSecurity
    )

ADD_DEFINITIONS( -DESPHTTP_EXPORTS -DESP_TIMING -D_USRDLL -DESP_PLUGIN )

HPCC_ADD_LIBRARY( esphttp SHARED ${SRCS} )
add_dependencies (esphttp  espscm )
install ( TARGETS esphttp RUNTIME DESTINATION ${EXEC_DIR} LIBRARY DESTINATION ${LIB_DIR} )
target_link_libraries ( esphttp 
         ${XALAN_LIBRARIES} ${XERCES_LIBRARIES}
         jlib
         xmllib 
    )
IF (USE_OPENLDAP)
target_link_libraries ( esphttp LdapSecurity )
ENDIF(USE_OPENLDAP)


