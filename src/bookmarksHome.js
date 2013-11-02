function ColumnTd() {
    // constructor for column

    this.node = document.createElement( "td" );
    this.depth = 0;
}

ColumnTd.prototype = {

add: function( folderDiv ) {
	 this.node.appendChild( folderDiv.node );
	 this.depth += ( folderDiv.depth + 1 );
     }
}

function FolderDiv( ancestors, index ) {
    // constructor for folder

    this.node = document.createElement( "div" );
    this.folderUl = document.createElement( "ul" );
    this.depth = 0;
    this.startDepth = 0;

    this.node.setAttribute( "class", "folder" );
    // folder h1
    var folderH1 = document.createElement( "h1" );
    this.node.appendChild( folderH1 );
    // header a
    var headerA = document.createElement( "a" );
    var listId = "folderList" + index;
    headerA.setAttribute( "href", "javascript:void(bmhCheck('openFolder','" + listId + "'))" );
    this.createHeaderText( ancestors, headerA );
    folderH1.appendChild( headerA );
    this.startDepth = this.depth;
    // folder ul
    this.folderUl.setAttribute( "id", listId );
    this.node.appendChild( this.folderUl );
}


FolderDiv.prototype = {

createHeaderText: function( ancestors, headerA ) {
		      // create folder header based on maximum header lines pref

		      var headerArray = eval( ancestors.toSource() );
		      var top = headerArray.length - bMHPrefs.getPref( "maxHeaderLines" );
		      var i = top;
		      if( top > 1 ) {
			  // at least one ancestor won't be displayed
			  headerArray[top] = "> ".concat( headerArray[top] );
			  i--;
			  // append '>' for other ancestors that won't be displayed
			  for( ; i > 1; i-- ) {
			      headerArray[top] = ">".concat( headerArray[top] );
			  }
		      }
		      // top <= 1 -> all ancestors (except root) will be displayed
		      i = ( top <= 1 ? 1 : top );
		      // root ancestor only displayed for root folder
		      if( ancestors.length == 1 ) {
			  i = 0;
		      }
		      var folderName, headerBr;
		      for( ; i < headerArray.length; i++ ) {
			  folderName = document.createTextNode( this.processName( headerArray[i] ));	
			  headerA.appendChild( folderName );
			  headerBr = document.createElement( "br" );
			  headerA.appendChild( headerBr );
			  this.depth++;
		      }
		      headerA.removeChild( headerBr );
		  },

add: function( name, url, description ) {
	 // folder li
	 var folderLi = document.createElement( "li" );
	 this.folderUl.appendChild( folderLi );
	 // folder a
	 var folderA = document.createElement( "a" );
	 folderA.setAttribute( "href", url );
	 var title = this.getTitle( name, description );
	 if( title ) {
	     folderA.setAttribute( "title", title );
	 }
	 folderLi.appendChild( folderA );
	 var aName = this.processName( name );
	 // text a
	 var aText = document.createTextNode( aName );
	 folderA.appendChild( aText ); 
	 this.depth++;
     },

getTitle: function( name, description ) {
	      return name.length > bMHPrefs.getPref( "maxNameLength" )
		  ? name
		  : null;
	  },

processName: function( name ) {
		 var displayName = name;
		 var reg1 = /^(?:\w+:[\/\\]{1,3}(?:www\.)?)/; 
		 var reg2 = /.{2}$/;	
		 max = bMHPrefs.getPref( "maxNameLength" );
		 if( displayName.length > max ) {
		     // remove protocol of url
		     displayName = displayName.replace( reg1, "" );
		     if( displayName.length > max ) {
			 displayName = displayName.substring( 0, max );
			 // show that name is longer than portrayed
			 displayName = displayName.replace( reg2, ".." );
		     }
		 }
		 return displayName;
	     }
}


function Folder( node, ancestors ) {
    this.node = node;
    // ancestors include name of folder
    this.ancestors = ancestors;
}

var bookmarksHome = {

main: function() {
	  // RDF variables
	  var RDF = bMHPrefs.getRDF();
	  var RDFC = bMHPrefs.getRDFC();
	  var RDFCU = bMHPrefs.getRDFCU();
	  var BMDS  = RDF.GetDataSource("rdf:bookmarks");
	  var root = RDF.GetResource( "NC:BookmarksRoot" );
	  var NameArc = RDF.GetResource( bMHPrefs.NC_NS + "Name" );
	  var URLArc =  RDF.GetResource( bMHPrefs.NC_NS + "URL" );
	  var DescriptionArc = RDF.GetResource( bMHPrefs.NC_NS + "Description" );

	  // initialize preferences
	  bMHPrefs.init();

	  // bookmarks collection variables
	  var curNameNode = BMDS.GetTarget( root, NameArc, true );
	  var curFolder;
	  if( curNameNode instanceof Components.interfaces.nsIRDFLiteral ) {
	      curFolder = new Folder( root, [curNameNode.Value] );
	  }
	  var folderStack = new Array( curFolder );
	  var inOrExcludedFolders = bMHPrefs.getPref( "inOrExcludedFolders" ).split( "|" );
	  var enumerator, tempFolders, curNode, curUrlNode;
	  var curDescriptionNode, desc, curNodeAncestors;

	  // add style 
	  bookmarksHome.addStyle();
	  // add table
	  bookmarksHome.addTable();
	  // add search bar
	  bookmarksHome.addSearchBar();

	  var columns = bMHPrefs.getPref( "nrOfColumns" ); 
	  var columnTds = new Array( columns );
	  for( i = 0; i < columnTds.length; i++ ) {
	      columnTds[i] = new ColumnTd();
	  }
	  var folderDiv;
	  var isExcluded, i, folderIndex = 0;
	  // make page
	  while( folderStack.length > 0 ) {
	      curFolder = folderStack.pop();
	      folderIndex++;
	      folderDiv = new FolderDiv( curFolder.ancestors, folderIndex );
	      RDFC.Init( BMDS, curFolder.node );
	      enumerator = RDFC.GetElements();
	      tempFolders = new Array();
	      while( enumerator.hasMoreElements() ) {
		  curNode = enumerator.getNext();
		  curNameNode = BMDS.GetTarget( curNode, NameArc, true );
		  curUrlNode = BMDS.GetTarget( curNode, URLArc, true );
		  if( curNameNode instanceof Components.interfaces.nsIRDFLiteral ) { 
		      if( curUrlNode instanceof Components.interfaces.nsIRDFLiteral ) { 
			  // curNameNode is bookmark
			  curDescriptionNode = BMDS.GetTarget( curNode, DescriptionArc, true );
			  desc = ( curDescriptionNode instanceof Components.interfaces.nsIRDFLiteral 
				  ? curDescriptionNode.Value : "" );
			  folderDiv.add( curNameNode.Value, curUrlNode.Value, desc );
		      }
		      else if( RDFCU.IsSeq( BMDS, curNode )) {
			  // curNameNode is folder
			  curNodeAncestors = curFolder.ancestors.concat( [curNameNode.Value] );
			  tempFolders.push( new Folder( curNode, curNodeAncestors ));
		      }
		  }
	      }
	      isExcluded = false;
	      isExcluded = bMHPrefs.isExcludedFolder( curFolder.ancestors.toString(),
		      bMHPrefs.getPref( "excludeIndex" ), inOrExcludedFolders );
	      // check if folder contains bookmarks and is not excluded
	      if( folderDiv.depth > folderDiv.startDepth && ! isExcluded ) {
		  i = bookmarksHome.smallestColumn( columnTds );
		  // add folder to smalles column
		  columnTds[i].add( folderDiv );
	      }
	      // reverse to match order in bookmarks tree
	      folderStack = folderStack.concat( tempFolders.reverse() );
	  }
	  // don't add empty columns
	  var mainRow = document.getElementsByTagName( "tr" )[0];
	  for( i = 0; i < columnTds.length; i++ ) {
	      if( columnTds[i].depth > 0 ) {
		  mainRow.appendChild( columnTds[i].node );
	      }
	  }
      },

smallestColumn: function( columns ) {
		    var index = 0;
		    for(var i = 1; i < columns.length; i++ ) {
			if( columns[i].depth < columns[index].depth ) {
			    index = i;
			}
		    }
		    return index;
		},

addStyle: function() {
	      // get styles datasource
	      var stylesDS = bMHPrefs.getStylesDS();
	      var RDF = bMHPrefs.getRDF();
	      // get default style
	      var defaultStyle = RDF.GetResource( bMHPrefs.stylesNS + "Default" );
	      var sheetArc = RDF.GetResource( bMHPrefs.stylesNS + "sheet" );
	      var defaultSheet = stylesDS.GetTarget( defaultStyle, sheetArc, true );
	      // insert stylesheet in document 
	      var styleTag = document.getElementsByTagName( "style" )[0];
	      if( defaultSheet instanceof Components.interfaces.nsIRDFLiteral ) { 
		  styleTag.innerHTML = bMHPrefs.formatSheet( defaultSheet.Value );
	      }
	  },

addTable: function() {
	      // add table
	      var theTable = document.createElement( "table" );
	      var body = document.getElementsByTagName( "body" )[0];
	      var linksDiv = document.getElementsByTagName( "div" )[0]; 
	      body.insertBefore( theTable, linksDiv );
	      // add tr
	      var theTr = document.createElement( "tr" );
	      theTable.appendChild( theTr );
	  },

addSearchBar: function() {
		  var engineIndex = bMHPrefs.getPref( "engine" );
		  if( ! bMHPrefs.getPref( "hideSearchEngines" )) {
		      // search form
		      var searchForm = document.createElement( "form" );
		      searchForm.setAttribute( "action", "javascript:bmhInternetSearch()" );
		      var refChild = document.getElementsByTagName( "table" )[0];
		      var body = document.getElementsByTagName( "body" )[0];
		      body.insertBefore( searchForm, refChild );
		      // search div
		      var searchDiv = document.createElement( "div" );
		      searchDiv.setAttribute( "id", "searchForm" );
		      searchDiv.setAttribute( "class", "bar" );
		      searchForm.appendChild( searchDiv );
		      // engine select 
		      var engineSelect = document.createElement( "select" );
		      engineSelect.setAttribute( "id", "engineSelect" );
		      searchDiv.appendChild( engineSelect );
		      // engine options
		      bookmarksHome.addEngineOptions( engineSelect );
		      // query input
		      queryInput = document.createElement( "input" );
		      queryInput.setAttribute( "type", "text" );
		      queryInput.setAttribute( "id", "queryInput" );
		      queryInput.setAttribute( "size", "31" );
		      searchDiv.appendChild( queryInput );
		      // submit input
		      submitInput = document.createElement( "input" );
		      submitInput.setAttribute( "type", "submit" );
		      submitInput.setAttribute( "value", "Search" );
		      searchDiv.appendChild( submitInput );
		      // set focus
		      queryInput.focus();
		  }
	      },

addEngineOptions: function( engineSelect ) {
		      var engineOption;
		      var engineName;
		      for( var i = 0; i < bMHPrefs.engines.length; i++ ) {
			  engineOption = document.createElement( "option" );
			  engineOption.setAttribute( "value", bMHPrefs.engines[i].value );
			  engineSelect.appendChild( engineOption );
			  engineName = document.createTextNode( bMHPrefs.engines[i].name );
			  engineOption.appendChild( engineName );
		      }
		  }
}



