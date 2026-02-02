<#
.SYNOPSIS           Sets the remote computer name, and description with GUI
.DESCRIPTION        Script will launch a GUI and prompt user for computer name, new name, description and credentials, and will then:
                    1) Check inputs to make sure they are not empty
                    2) Test connectivity to remote computer
                    3) Send command to set the description
                    4) Send command to change computer name
                    5) Write output to GUI
#>

Add-Type -AssemblyName PresentationFramework                                                #Use WPF assembly

#XAML for WPF app
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        Title="Computer Rename Tool" Height="300" Width="450" WindowStartupLocation="CenterScreen">
    <Grid>
        <Label x:Name="header" Content="Local Computer Editor" HorizontalAlignment="Left" Margin="10,0,0,0" VerticalAlignment="Top" Width="423" FontWeight="Bold" FontSize="14" HorizontalContentAlignment="Center"/>
        <Label x:Name="existing_label" Content="Old (existing) computer name:" HorizontalAlignment="Left" Margin="10,30,0,0" VerticalAlignment="Top" Height="25"/>
        <TextBox x:Name="existing_textbox" HorizontalAlignment="Left" Height="25" Margin="206,30,0,0" TextWrapping="NoWrap" VerticalAlignment="Top" Width="215" VerticalContentAlignment="Center" BorderBrush="#FF4164CD"/>
        <Label x:Name="newname_label" Content="New computer name:" HorizontalAlignment="Left" Margin="10,64,0,0" VerticalAlignment="Top" Height="25"/>
        <TextBox x:Name="newname_textbox" HorizontalAlignment="Left" Height="25" Margin="207,64,0,0" TextWrapping="NoWrap" VerticalAlignment="Top" Width="215" VerticalContentAlignment="Center" BorderBrush="#FF4164CD"/>
        <Label x:Name="description_label" Content="Set new computer description:" HorizontalAlignment="Left" Margin="11,101,0,0" VerticalAlignment="Top" Height="25"/>
        <TextBox x:Name="description_textbox" HorizontalAlignment="Left" Height="25" Margin="207,100,0,0" TextWrapping="NoWrap" VerticalAlignment="Top" Width="215" VerticalContentAlignment="Center" BorderBrush="#FF4164CD"/>
        <Label x:Name="username_label" Content="Username:" HorizontalAlignment="Left" Margin="11,130,0,0" VerticalAlignment="Top" Height="25" Width="194" HorizontalContentAlignment="Center"/>
        <Label x:Name="password_label" Content="Password:" HorizontalAlignment="Left" Margin="207,130,0,0" VerticalAlignment="Top" Height="25" Width="226" HorizontalContentAlignment="Center"/>
        <TextBox x:Name="username_textbox" HorizontalAlignment="Left" Height="25" Margin="10,160,0,0" TextWrapping="NoWrap" VerticalAlignment="Top" Width="185" VerticalContentAlignment="Center" BorderBrush="#FF4164CD"/>
        <PasswordBox x:Name="password_textbox" HorizontalAlignment="Left" Margin="236,160,0,0" VerticalAlignment="Top" Height="25" Width="185" BorderThickness="1" BorderBrush="#FF4164CD" VerticalContentAlignment="Center"/>
        <Button x:Name="go_button" Content="Save" HorizontalAlignment="Left" Margin="358,226,0,0" VerticalAlignment="Top" Width="75" BorderBrush="#FF5F7DE0" VerticalContentAlignment="Center"/>
        <Button x:Name="validate_button" Content="Validate" HorizontalAlignment="Left" Margin="278,226,0,0" VerticalAlignment="Top" Width="75" BorderBrush="#FF5F7DE0" VerticalContentAlignment="Center"/>
        <Button x:Name="clear_button" Content="Clear" HorizontalAlignment="Left" Margin="238,226,0,0" VerticalAlignment="Top" Width="35" BorderBrush="#FF5F7DE0" VerticalContentAlignment="Center"/>
        <TextBlock x:Name="log" HorizontalAlignment="Left" Margin="6,193,0,0" TextWrapping="NoWrap" Text="" VerticalAlignment="Top" Height="67" Width="225" Panel.ZIndex="1" FontSize="10" Foreground="#FF19A511" ScrollViewer.VerticalScrollBarVisibility="Auto" ScrollViewer.HorizontalScrollBarVisibility="Auto" ScrollViewer.CanContentScroll="True"/>
        <CheckBox x:Name="reboot_checkbox" Content="Reboot on completion" HorizontalAlignment="Left" Margin="236,190,0,0" VerticalAlignment="Top"/>
    </Grid>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)                                                                   #Setup dotnet xmlnodereader
$Window = [Windows.Markup.XamlReader]::Load($reader)                                                                    #Input the XAML content into the reader
$xaml.SelectNodes("//*[@*[contains(translate(name(.),'n','N'),'Name')]]")  | ForEach {                                  #For each xml selectnodes path, get the control names
    New-Variable  -Name $_.Name -Value $Window.FindName($_.Name) -Force                                                 #Create a variable for each control to be called later
}

#Initialise these Global variables and set to null:
$global:computer = $null
$global:newname = $null
$global:description = $null
$global:user = $null
$global:pass = $null
$global:cred = $null

$go_button.IsEnabled = $false                                                                                               #Set 'Save' button to disabled
$log.Text += "Please fill in all fields, and click Validate`n"                                                              #Update result box

$validate_button.Add_Click({                                                                                                #Add click function for the 'validate' button
    $Global:user = $username_textbox.Text                                                                                   #Get the username from the textbox
    $Global:pass = $password_textbox.Password                                                                               #Get the password from the textbox
    $Global:secpass = convertto-securestring "$pass" -asplaintext -force                                                    #Create a secure password string
    $Global:cred = New-Object System.Management.Automation.PSCredential ($Global:user, $Global:secpass)                     #Create a credential object

    $Global:computer = $existing_textbox.Text                                                                               #Get computername from textbox
    $Global:newname = $newname_textbox.Text                                                                                 #Get new computer name from textbox
    $Global:description = $description_textbox.Text                                                                         #Get description from textbox

    if ($cred -ne $null -and $computer -ne $null){                                                                          #If credential exists, and computer name exists
        write-host "ready"
        if (Test-Connection $Global:computer -count 1 -ErrorAction SilentlyContinue){
            $log.Text += "Tested connectivity to $Global:computer `n"                                                       #Update log file
            $log.Text += "Please press Save button to action these changes `n"                                              #Update log file
            $go_button.IsEnabled = $true  
        }
        else{
            write-host "Couldn't connect to $Global:computer"
        }
    }
})

$go_button.Add_Click({                                                                                                      #Add an event click for the save button
    if ($description_textbox.text.length -ge 2){                                                                            #Check that description is not empty
        $get_WMI = Get-WmiObject -class Win32_OperatingSystem -computername $global:computer -Credential $global:cred       #Make a WMI connection to computer
        $log.Text += "Current description for $global:computer is: $($get_wmi.description) `n"                              #Update log file
        $get_WMI.Description = $description_textbox.Text                                                                    #Set description on remote computer
        $get_WMI.put()                                                                                                      #Commit the changes
        $log.Text += "Set description to $($description_textbox.text) `n"                                                   #Update log file
    }
    if ($reboot_checkbox.IsChecked -eq $true){                                                                              #If the reboot checkbox is ticked
        try{
            $log.Text += "Renaming $global:computer to $global:newname `n"                                                  #Updat elog
            rename-computer -ComputerName $global:computer -NewName $global:newname -DomainCredential $global:cred -Restart -ErrorAction SilentlyContinue    #Rename the computer, with restart
        }
        catch{
            $log.Text += "ERROR: Unable to rename the $global:computer`n"
        }
    }
    if ($reboot_checkbox.IsChecked -eq $false){                                                                             #If the reboot option is unticked, then
        try{
            $log.Text += "Renaming $global:computer to $global:newname `n"                                                  #Update log file
            rename-computer -ComputerName $global:computer -NewName $global:newname -DomainCredential $global:cred -PassThru -Force  #Rename the computer, but without restart
        }
        catch{
            $log.Text += "ERROR: Unable to rename the $global:computer`n"
        }
    }
    $log.text = ""                                                                                                          #Empty the log box
    $log.text += "$global:computer changed to $global:newname `n"                                                           #Update log with the changed name   
    $log.Text += "Description for $global:computer set to $global:description `n"                                           #Update log with the description set
    $log.Text += "Done"                                                                                                     #Write done to log
})

$clear_button.Add_Click({                                                                                                   #If the 'clear' button is triggered
    $existing_textbox.Text = ""                                                                                             #Reset computername
    $newname_textbox.Text = ""                                                                                              #Reset newname
    $description_textbox.Text = ""                                                                                          #Reset description
    $username_textbox.Text = ""                                                                                             #Reset username
    $password_textbox.Password = $null                                                                                      #Reset password
    $reboot_checkbox.IsChecked = $false                                                                                     #Reset reboot checkbox
})

[void]$window.ShowDialog()                                                                                                  #Call the GUI
