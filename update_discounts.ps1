 = @('15%', '30%', '25%', '40%', '10%', '35%', '15%', '45%', '20%', '30%', '50%', '25%', '10%', '40%', '15%', '30%', '20%', '25%', '10%')
 = @('catalogo.html', 'index.html')

foreach ( in ) {
    if (Test-Path ) {
         = Get-Content 
         = 0
         = 0
        for ( = 0;  -lt .Length; ++) {
            if ([] -match 'class="font-bold">20%</span> off</span>') {
                if ( -lt .Length) {
                    [] = [] -replace '20%', []
                    ++
                }
            }
            if ([] -match 'price:\s*".+"') {
                if ( -lt .Length) {
                    [] = [] + " discount: '" + [] + " off',"
                    ++
                }
            }
        }
         | Set-Content  -Encoding UTF8
    }
}
